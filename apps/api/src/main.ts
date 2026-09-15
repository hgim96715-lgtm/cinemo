import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { EnvKeys } from './config/env.keys';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const appEnv = configService.get<string>('app.env') ?? 'local';

  const port = configService.get<number>(EnvKeys.PORT) ?? 3050;
  const frontendUrl = configService.getOrThrow<string>('auth.frontendUrl');
  const frontendOrigin = frontendUrl ? new URL(frontendUrl).origin : undefined;

  app.enableCors({
    origin: frontendOrigin
      ? ['http://localhost:3051', 'http://127.0.0.1:3051', frontendOrigin]
      : undefined,
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  if (appEnv !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('CINEMO API')
      .setDescription('Cinema in Motion — 영화관 로비 API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(port);
}
bootstrap();
