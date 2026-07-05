import { expect, test } from '@playwright/test'
import { accountFor, allRoles } from './support/accounts'
import { allowedRoutesFor, homeByRole } from './support/app'
import { assertNoFatalUiError, loginViaUi } from './support/auth'

test.describe('role full-flow navigation', () => {
  for (const role of allRoles) {
    const account = accountFor(role)

    test.describe(`${role}`, () => {
      test.skip(!account, `Missing account for ${role}`)

      test('can login and land on role home page', async ({ page }) => {
        await loginViaUi(page, account!, role)
        await expect(page).toHaveURL(new RegExp(`${homeByRole[role].replaceAll('/', '\\/')}`))
        await assertNoFatalUiError(page)
      })

      for (const route of allowedRoutesFor(role)) {
        test(`can open allowed route ${route.path}`, async ({ page }) => {
          await loginViaUi(page, account!, role)
          await page.goto(route.path)
          await page.waitForLoadState('networkidle')

          await expect(page).not.toHaveURL(/\/$/)
          await expect(page.locator('body')).not.toContainText(/not authorized|forbidden|unauthorized/i)
          await assertNoFatalUiError(page)
        })
      }
    })
  }
})
