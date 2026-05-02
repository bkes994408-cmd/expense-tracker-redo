import { expect, test } from '@playwright/test';

test('quick entry: 可從首頁快速記帳並保留幣別語意', async ({ page }) => {
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
        recentQuickEntries: [],
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

  await page.getByLabel('首頁快速記一筆').click();
  await expect(page.getByLabel('快速輸入記帳')).toHaveValue('');

  await page.getByLabel('快速輸入記帳').fill('USD 20 lunch');
  await page.getByLabel('解析快速輸入').click();
  await expect(page.getByLabel('快速輸入預覽')).toContainText('支出 · 餐飲 · lunch · 20 · USD');
  await page.getByText('儲存').click();

  await page.getByLabel('切換到收支').click();
  await expect(page.getByLabel('交易列lunch')).toBeVisible();
  await expect(page.getByLabel('交易幣別語意lunch')).toContainText('原始 US$ → 顯示 NT$（未換算）');

  await page.getByLabel('切換到總覽').click();
  await expect(page.getByLabel('首頁最近快速輸入USD 20 lunch')).toBeVisible();
});
