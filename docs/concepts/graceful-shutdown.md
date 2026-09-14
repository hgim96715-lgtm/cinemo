# NestJS graceful shutdown

## 개념

graceful shutdown은 서버 프로세스가 종료될 때 진행 중인 정리 작업을 수행한 뒤 안전하게 종료하는 방식임.

운영 환경에서는 배포·재시작·스케일 조정 시 서버에 `SIGTERM` 같은 종료 신호가 전달될 수 있음. 종료 신호를 즉시 무시하거나 강제 종료하면 DB 연결, 외부 연결, 작업 중인 리소스가 정상적으로 정리되지 않을 수 있음.

```txt
배포·재시작
  → 플랫폼이 API 프로세스에 SIGTERM 전달
  → NestJS shutdown hooks 실행
  → PrismaService.onModuleDestroy()
  → Prisma Client 연결 종료
  → 프로세스 종료
```

## CINEMO 적용

`apps/api/src/main.ts`에서 앱 생성 직후 shutdown hook을 활성화함.

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);

app.enableShutdownHooks();
```

`enableShutdownHooks()`는 NestJS가 운영체제 종료 신호를 받아 모듈 생명주기 종료 훅을 실행하도록 연결함.

현재 `PrismaService`는 `OnModuleDestroy`를 구현하고 있으므로 API가 정상 종료될 때 Prisma 연결도 정리됨.

```ts
async onModuleDestroy() {
  await this.$disconnect();
}
```

## Railway에서 필요한 이유

Railway 배포 중 기존 API 인스턴스가 종료되고 새 인스턴스가 시작될 수 있음. 이때 `SIGTERM`을 NestJS 생명주기와 연결해 두면 DB connection pool 같은 서버 리소스를 정리한 뒤 종료할 수 있음.

단, `enableShutdownHooks()`가 요청을 무한히 기다리게 하거나 배포 자체를 보장하는 기능은 아님. 진행 중인 요청의 graceful 처리 시간은 플랫폼의 종료 유예 시간과 서버 구현에 영향을 받음.

## 적용 기준

| 대상 | 처리 방식 |
| --- | --- |
| Prisma DB 연결 | `OnModuleDestroy`에서 `$disconnect()` |
| Cron·worker | 종료 시 새 작업 수신 중단 후 실행 중 작업 정리 |
| WebSocket | 연결 종료 및 서버 리소스 정리 |
| 외부 클라이언트 | SDK별 close·disconnect 메서드 호출 |
| 단순 HTTP 서버 | `app.enableShutdownHooks()`로 Nest 생명주기 연결 |

## 주의사항

- `enableShutdownHooks()`를 추가했다고 모든 리소스가 자동으로 정리되는 것은 아님
- 정리해야 하는 리소스는 해당 provider에서 `OnModuleDestroy` 또는 적절한 종료 훅으로 직접 구현함
- 종료 훅 안에서 긴 재시도나 새로운 작업을 시작하지 않음
- 로컬 개발 서버의 일반적인 새로고침 기능과는 별개의 서버 종료 처리임

## 관련 코드

- `apps/api/src/main.ts`: shutdown hook 활성화
- `apps/api/src/prisma/prisma.service.ts`: Prisma 연결 생성·종료
- [Railway 배포 문서](../deploy/railway.md)
