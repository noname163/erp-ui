import fs from 'node:fs'
import path from 'node:path'

export type RoleCode =
  | 'SYSTEM_ADMIN'
  | 'ADMIN'
  | 'COMPANY_MANAGER'
  | 'HUMAN_RESOURCES'
  | 'EMPLOYEE'

export type TestAccount = {
  email: string
  password: string
}

export type TestDataConfig = {
  payrollRunCode?: string
  payrollRunMonth?: string
  dailyWorkEmployeeCode?: string
}

export const allRoles: RoleCode[] = [
  'SYSTEM_ADMIN',
  'ADMIN',
  'COMPANY_MANAGER',
  'HUMAN_RESOURCES',
  'EMPLOYEE',
]

type AccountsFile = {
  roles?: Partial<Record<RoleCode, Partial<TestAccount>>>
  data?: TestDataConfig
}

const localAccountPath = path.resolve(process.cwd(), 'e2e/test-accounts.local.json')
const localConfig = readLocalConfig(localAccountPath)

export function accountFor(role: RoleCode): TestAccount | null {
  const fromEnv = {
    email: process.env[`E2E_${role}_EMAIL`] ?? '',
    password: process.env[`E2E_${role}_PASSWORD`] ?? '',
  }

  const fromFile = localConfig.roles?.[role]
  const account = {
    email: fromEnv.email || fromFile?.email || '',
    password: fromEnv.password || fromFile?.password || '',
  }

  return account.email && account.password ? account : null
}

export function requireAccount(role: RoleCode): TestAccount {
  const account = accountFor(role)
  if (!account) {
    throw new Error(`Missing E2E account for role ${role}. Fill e2e/test-accounts.local.json or E2E_${role}_EMAIL/PASSWORD.`)
  }
  return account
}

export function testData(): TestDataConfig {
  return {
    payrollRunCode: process.env.E2E_PAYROLL_RUN_CODE || localConfig.data?.payrollRunCode,
    payrollRunMonth: process.env.E2E_PAYROLL_RUN_MONTH || localConfig.data?.payrollRunMonth,
    dailyWorkEmployeeCode: process.env.E2E_DAILY_WORK_EMPLOYEE_CODE || localConfig.data?.dailyWorkEmployeeCode,
  }
}

export function allowMutation() {
  return process.env.E2E_ALLOW_MUTATION === 'true'
}

export function apiBaseUrl() {
  return process.env.E2E_API_BASE_URL ?? 'http://localhost:8080'
}

function readLocalConfig(filePath: string): AccountsFile {
  if (!fs.existsSync(filePath)) return {}
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as AccountsFile
}
