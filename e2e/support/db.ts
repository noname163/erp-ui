import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export type DbConfig = {
  jdbcUrl: string
  username: string
  password: string
}

export const TEST_EMPLOYEE_PASSWORD = process.env.E2E_PREP_EMPLOYEE_PASSWORD ?? 'Test@123456'

// BCrypt for TEST_EMPLOYEE_PASSWORD. Regenerate if the default password changes.
const DEFAULT_TEST_PASSWORD_BCRYPT = '$2a$10$ZD4SqDW1G8CCwMeKTt3mdu/Di7T3d5wR.p3xEvfvMhtqTwxl8Wg8i'

export function dbPatchEnabled() {
  return process.env.E2E_PREP_SKIP_DB_PATCH !== 'true'
}

export function loadDbConfig(): DbConfig {
  const envFile = readDotEnv(path.resolve(process.cwd(), '../erp/.env'))
  return {
    jdbcUrl: process.env.E2E_DB_URL || envFile.DB_URL || 'jdbc:postgresql://localhost:5432/erp',
    username: process.env.E2E_DB_USERNAME || envFile.DB_USERNAME || 'postgres',
    password: process.env.E2E_DB_PASSWORD || envFile.DB_PASSWORD || 'admin',
  }
}

export function patchEmployeePassword(email: string) {
  runDbTool([
    'set-password',
    ...dbArgs(),
    email,
    passwordHash(),
  ])
}

export function createDepartmentInDb(hrEmail: string, code: string, name: string, description: string) {
  const result = runDbTool([
    'create-department',
    ...dbArgs(),
    hrEmail,
    code,
    name,
    description,
  ])
  return result.trim() || code
}

export function createEmployeeInDb(input: {
  hrEmail: string
  accountCode: string
  userProfileCode: string
  email: string
  firstName: string
  lastName: string
  departmentCode: string
  phone: string
}) {
  const result = runDbTool([
    'create-employee',
    ...dbArgs(),
    input.hrEmail,
    input.accountCode,
    input.userProfileCode,
    input.email,
    input.firstName,
    input.lastName,
    input.departmentCode,
    input.phone,
  ])
  return result.trim() || input.userProfileCode
}

export function createSalaryInDb(input: {
  hrEmail: string
  salaryCode: string
  name: string
  calculateMethod: string
  isDeduct: boolean
}) {
  const result = runDbTool([
    'create-salary',
    ...dbArgs(),
    input.hrEmail,
    input.salaryCode,
    input.name,
    input.calculateMethod,
    String(input.isDeduct),
  ])
  return result.trim() || input.salaryCode
}

export function createSalaryTemplateInDb(input: {
  hrEmail: string
  templateCode: string
  name: string
  totalAmount: string
  effectiveFrom: string
  effectiveTo: string
  baseSalaryCode: string
  allowanceSalaryCode: string
}) {
  const result = runDbTool([
    'create-salary-template',
    ...dbArgs(),
    input.hrEmail,
    input.templateCode,
    input.name,
    input.totalAmount,
    input.effectiveFrom,
    input.effectiveTo,
    input.baseSalaryCode,
    input.allowanceSalaryCode,
  ])
  return result.trim() || input.templateCode
}

export function createEmployeeSalaryInDb(input: {
  hrEmail: string
  employeeSalaryCode: string
  userProfileCode: string
  templateCode: string
  effectiveFrom: string
  effectiveTo: string
  totalAmount: string
  baseSalaryCode: string
  allowanceSalaryCode: string
}) {
  const result = runDbTool([
    'create-employee-salary',
    ...dbArgs(),
    input.hrEmail,
    input.employeeSalaryCode,
    input.userProfileCode,
    input.templateCode,
    input.effectiveFrom,
    input.effectiveTo,
    input.totalAmount,
    input.baseSalaryCode,
    input.allowanceSalaryCode,
  ])
  return result.trim() || input.employeeSalaryCode
}

export function insertDefaultPayRates(policyCode: string, codePrefix: string, effectiveFrom: string, effectiveTo: string) {
  runDbTool([
    'insert-pay-rates',
    ...dbArgs(),
    policyCode,
    codePrefix,
    effectiveFrom,
    effectiveTo,
  ])
}

function passwordHash() {
  if (TEST_EMPLOYEE_PASSWORD !== 'Test@123456') {
    throw new Error('Custom E2E_PREP_EMPLOYEE_PASSWORD requires updating the BCrypt hash in e2e/support/db.ts')
  }
  return DEFAULT_TEST_PASSWORD_BCRYPT
}

function dbArgs() {
  const config = loadDbConfig()
  return [config.jdbcUrl, config.username, config.password]
}

function runDbTool(args: string[]) {
  const postgresJar = findPostgresJar()
  const javaFile = path.resolve(process.cwd(), 'e2e/support/DbTool.java')
  const result = spawnSync('java', ['-cp', postgresJar, javaFile, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error([
      `DbTool failed with status ${result.status}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join('\n'))
  }

  return result.stdout
}

function findPostgresJar() {
  const root = path.resolve(process.cwd(), '../erp/.m2/repository/org/postgresql/postgresql')
  if (!fs.existsSync(root)) {
    throw new Error(`PostgreSQL JDBC directory not found: ${root}`)
  }

  const versions = fs.readdirSync(root).sort().reverse()
  for (const version of versions) {
    const jar = path.join(root, version, `postgresql-${version}.jar`)
    if (fs.existsSync(jar)) return jar
  }

  throw new Error(`PostgreSQL JDBC jar not found under ${root}`)
}

function readDotEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const result: Record<string, string> = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index < 0) continue
    result[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }
  return result
}
