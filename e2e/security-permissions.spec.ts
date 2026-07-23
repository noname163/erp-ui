import { expect, test } from '@playwright/test'
import { accountFor, allRoles, requireAccount } from './support/accounts'
import { forbiddenRoutesFor, homeByRole } from './support/app'
import { authenticatedApi, disposeApi } from './support/api'
import { loginViaUi } from './support/auth'

test.describe('role permissions', () => {
  for (const role of allRoles) {
    const account = accountFor(role)

    test.describe(`${role} UI route guards`, () => {
      test.skip(!account, `Missing account for ${role}`)

      for (const route of forbiddenRoutesFor(role).slice(0, 8)) {
        test(`redirects away from forbidden route ${route.path}`, async ({ page }) => {
          await loginViaUi(page, account!, role)
          await page.goto(route.path)
          await page.waitForLoadState('networkidle')

          await expect(page).toHaveURL(new RegExp(`${homeByRole[role].replaceAll('/', '\\/')}`))
        })
      }
    })
  }

  test('employee or manager accounts cannot access HR payroll APIs', async () => {
    const candidate = accountFor('EMPLOYEE') ?? accountFor('COMPANY_MANAGER')
    test.skip(!candidate, 'Missing EMPLOYEE or COMPANY_MANAGER account')

    const api = await authenticatedApi(candidate!)
    try {
      const response = await api.get('/api/payroll-runs')
      expect([401, 403]).toContain(response.status())
    } finally {
      await disposeApi(api)
    }
  })

  test('HR can access payroll API', async () => {
    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.get('/api/payroll-runs')
      expect(response.status()).toBe(200)
    } finally {
      await disposeApi(api)
    }
  })
})
