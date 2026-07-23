import { expect, type Page } from '@playwright/test'
import type { RoleCode, TestAccount } from './accounts'
import { homeByRole } from './app'

export async function loginViaUi(page: Page, account: TestAccount, role: RoleCode) {
  await page.goto('/')
  await page.locator('input[name="email"]').fill(account.email)
  await page.locator('input[name="password"]').fill(account.password)
  await page.getByRole('button', { name: /sign in|đăng nhập|登入/i }).click()
  await page.waitForLoadState('networkidle')
  await page.evaluate((nextRole) => localStorage.setItem('erp.role', nextRole), role)
  await page.goto(homeByRole[role])
  await page.waitForLoadState('networkidle')
  await expect(page).not.toHaveURL(/\/$/)
}

export async function assertNoFatalUiError(page: Page) {
  await expect(page.locator('body')).not.toContainText(/Cannot read properties|Unhandled|TypeError|ReferenceError/i)
}
