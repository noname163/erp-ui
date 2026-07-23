import { expect, test } from '@playwright/test'
import { allowMutation, requireAccount, testData } from './support/accounts'
import { authenticatedApi, disposeApi, itemsFromPagedResponse, safeJson } from './support/api'
import { loginViaUi } from './support/auth'

test.describe('HR payroll and working-log regression suite', () => {
  test('Payroll Runs UI loads for HR', async ({ page }) => {
    await loginViaUi(page, requireAccount('HUMAN_RESOURCES'), 'HUMAN_RESOURCES')
    await page.goto('/payroll/runs')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toContainText(/payroll|bảng lương|lương/i)
    await expect(page.locator('body')).not.toContainText(/Cannot read properties|TypeError|ReferenceError/i)
  })

  test('payroll run list API happy case', async () => {
    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.get('/api/payroll-runs', {
        params: { page: 0, size: 10, sortDir: 'DESC' },
      })
      expect(response.status()).toBe(200)
      const payload = await safeJson(response)
      expect(itemsFromPagedResponse(payload).length).toBeGreaterThanOrEqual(0)
    } finally {
      await disposeApi(api)
    }
  })

  test('payroll run missing runDate returns validation error, not server error', async () => {
    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.post('/api/payroll-runs')
      expect(response.status()).toBe(400)
    } finally {
      await disposeApi(api)
    }
  })

  test('payroll run invalid runDate returns validation error, not server error', async () => {
    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.post('/api/payroll-runs', {
        params: { runDate: '2026-13' },
      })
      expect(response.status()).toBe(400)
    } finally {
      await disposeApi(api)
    }
  })

  test('calculated payroll result has actual amount and quantity', async () => {
    const runCode = testData().payrollRunCode
    test.skip(!runCode, 'Missing payrollRunCode in e2e/test-accounts.local.json or E2E_PAYROLL_RUN_CODE')

    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.get('/api/payroll-results', {
        params: { payrollRunCode: runCode, page: 0, size: 50 },
      })
      expect(response.status()).toBe(200)
      const payload = await safeJson(response)
      const rows = itemsFromPagedResponse(payload)

      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        expect(row.actualAmount, `${row.employeeCode} actualAmount`).not.toBeNull()
        expect(row.actualQuantity, `${row.employeeCode} actualQuantity`).not.toBeNull()
        expect(row.sourceType, `${row.employeeCode} sourceType`).not.toBe('RUNNING')
      }
    } finally {
      await disposeApi(api)
    }
  })

  test('Working Logs UI loads for HR', async ({ page }) => {
    await loginViaUi(page, requireAccount('HUMAN_RESOURCES'), 'HUMAN_RESOURCES')
    await page.goto('/timesheets')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toContainText(/working|timesheet|log|công|giờ/i)
    await expect(page.locator('body')).not.toContainText(/Cannot read properties|TypeError|ReferenceError/i)
  })

  test('working log date range startDate > endDate returns validation error', async () => {
    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.get('/api/employee-daily-works', {
        params: { startDate: '2026-08-31', endDate: '2026-08-01' },
      })
      expect(response.status()).toBe(400)
    } finally {
      await disposeApi(api)
    }
  })

  test('working log PTO filter uses API parameter compatible with UI filter', async () => {
    const employeeCode = testData().dailyWorkEmployeeCode
    test.skip(!employeeCode, 'Missing dailyWorkEmployeeCode in e2e/test-accounts.local.json or E2E_DAILY_WORK_EMPLOYEE_CODE')

    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.get('/api/employee-daily-works', {
        params: {
          employeeCode,
          startDate: '2026-08-01',
          endDate: '2026-08-31',
          usedPto: true,
          page: 0,
          size: 50,
        },
      })
      expect(response.status()).toBe(200)
      const payload = await safeJson(response)
      const rows = itemsFromPagedResponse(payload)

      expect(rows.length).toBeGreaterThan(0)
      expect(rows.every((row) => row.usedPto === true)).toBe(true)
    } finally {
      await disposeApi(api)
    }
  })

  test('PTO paid leave log can be created without fake start/end time', async () => {
    const employeeCode = testData().dailyWorkEmployeeCode
    test.skip(!employeeCode, 'Missing dailyWorkEmployeeCode in e2e/test-accounts.local.json or E2E_DAILY_WORK_EMPLOYEE_CODE')

    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.post('/api/employee-daily-works', {
        data: [
          {
            userProfileCode: employeeCode,
            workingDate: '2026-08-20',
            quantity: 8,
            unit: 'HOUR',
            workType: 'PTO_PAID',
            usedPto: true,
            otTime: 0,
          },
        ],
      })

      expect(response.status()).toBe(201)
    } finally {
      await disposeApi(api)
    }
  })

  test('can create a new payroll run when mutation tests are explicitly enabled', async () => {
    test.skip(!allowMutation(), 'Set E2E_ALLOW_MUTATION=true to run data-changing payroll flow')

    const runMonth = testData().payrollRunMonth
    test.skip(!runMonth, 'Missing payrollRunMonth in e2e/test-accounts.local.json or E2E_PAYROLL_RUN_MONTH')

    const api = await authenticatedApi(requireAccount('HUMAN_RESOURCES'))
    try {
      const response = await api.post('/api/payroll-runs', {
        params: { runDate: runMonth },
      })
      expect([201, 409]).toContain(response.status())
    } finally {
      await disposeApi(api)
    }
  })
})
