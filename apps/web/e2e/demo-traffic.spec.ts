import { test, type Page } from '@playwright/test';

const shortPause = 1_200;

async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}

async function openHome(page: Page) {
  await page.goto('/');
}

async function openCinemaMap(page: Page) {
  await openHome(page);
  await page.getByRole('link', { name: '지역별 영화관 탐색' }).click();
  await page
    .getByRole('searchbox', { name: '영화관 검색' })
    .waitFor({ state: 'visible', timeout: 15_000 });
}

async function searchCinema(page: Page, keyword: string) {
  const searchBox = page.getByRole('searchbox', { name: '영화관 검색' });
  await searchBox.fill(keyword);
  await pause(page, shortPause);

  const firstCinema = page.locator('.cinema-map-name-button').first();

  try {
    await firstCinema.waitFor({ state: 'visible', timeout: 10_000 });
    await firstCinema.click();
  } catch {
    // 검색 결과가 없는 날에도 검색 흐름 자체는 정상적인 Demo 시나리오로 처리함
  }
}

test.describe('CINEMO 공개 Demo 합성 트래픽', () => {
  test('홈을 잠깐 방문하고 이탈하는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');

    await openHome(page);
    await pause(page, 4_500);
  });

  test('영화 차트를 살펴보다가 중단하는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');

    await openHome(page);
    await pause(page, 1_000);
    await page.getByRole('link', { name: 'MOVIE CHART 보기' }).click();
    await pause(page, 5_000);
  });

  test('개봉 예정 영화를 확인하는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');

    await openHome(page);
    await pause(page, 1_400);
    await page.getByRole('link', { name: '곧 스크린에서 만날 영화' }).click();
    await pause(page, 4_500);
  });

  test('공개 엽서를 둘러보는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');

    await openHome(page);
    await pause(page, 1_800);
    await page.getByRole('link', { name: 'CINEMO 엽서 보기' }).click();
    await pause(page, 4_000);
  });

  test('영화관을 검색하고 목록에서 선택하는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');

    await openCinemaMap(page);
    await pause(page, 1_600);
    await searchCinema(page, '메가박스');
    await pause(page, 2_500);
  });

  test('모바일에서 영화관을 검색하는 사용자', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile');

    await openCinemaMap(page);
    await pause(page, 1_200);
    await searchCinema(page, 'CGV');
    await pause(page, 2_000);
  });
});
