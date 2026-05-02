import { expect, test } from '@playwright/test';

test('smoke: 新增交易後可在報表看到結果', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date();
    const currentMonth = now.getMonth();

    const appState = {
      state: {
        style: 'minimal',
        mode: 'light',
        tab: 0,
        month: currentMonth,
        currency: 'NTD',
        monthStartDay: 1,
        billReminder: true,
        iCloudBackup: false,
        recentCategories: [],
        recentNotes: [],
        recentCategoryStats: {},
        recentNoteStats: {},
        recentNoteCategoryStats: {},
      },
      version: 1,
    };

    const financeState = {
      state: {
        transactions: [],
        recurring: [],
        goals: [],
        budgets: {
          餐飲: 0,
          交通: 0,
          購物: 0,
          娛樂: 0,
          帳單: 0,
          健康: 0,
          教育: 0,
          其他: 0,
        },
      },
      version: 2,
    };

    window.localStorage.setItem('expense-tracker-redo-app-ui', JSON.stringify(appState));
    window.localStorage.setItem('expense-tracker-redo-finance', JSON.stringify(financeState));
  });

  await page.goto('/');

  await page.getByLabel('新增交易').click();
  await page.getByText('手動輸入').click();
  await page.getByRole('spinbutton').fill('200');
  await page.getByPlaceholder('備註說明…').fill('Playwright Smoke 支出');
  await page.getByText('交通').first().click();
  await page.getByText('儲存').click();

  await page.getByText('報表').click();

  await expect(page.getByLabel('月支出目前選取月份')).toContainText('NT$200');
});
