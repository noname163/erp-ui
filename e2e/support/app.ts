import type { RoleCode } from './accounts'

export type AppRouteConfig = {
  path: string
  roles?: RoleCode[]
  public?: boolean
}

export const homeByRole: Record<RoleCode, string> = {
  SYSTEM_ADMIN: '/dashboard',
  ADMIN: '/dashboard',
  COMPANY_MANAGER: '/dashboard',
  HUMAN_RESOURCES: '/hr',
  EMPLOYEE: '/timesheets',
}

export const appRoutes: AppRouteConfig[] = [
  { path: '/', public: true },
  { path: '/reset-password' },
  { path: '/dashboard', roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'] },
  { path: '/calendars', roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER', 'HUMAN_RESOURCES'] },
  { path: '/calendars/new', roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER', 'HUMAN_RESOURCES'] },
  { path: '/companies', roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  { path: '/companies/new', roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  { path: '/departments', roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'] },
  { path: '/hr', roles: ['HUMAN_RESOURCES'] },
  { path: '/employees', roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER', 'HUMAN_RESOURCES'] },
  { path: '/employees/new', roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER'] },
  { path: '/payroll/components', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/templates', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/runs', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/results', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/builder', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/policies', roles: ['HUMAN_RESOURCES'] },
  { path: '/payroll/policy/builder', roles: ['HUMAN_RESOURCES'] },
  { path: '/salary/slip', roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER', 'EMPLOYEE'] },
  { path: '/salary/slips', roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER', 'EMPLOYEE'] },
  { path: '/timesheets', roles: ['EMPLOYEE', 'HUMAN_RESOURCES'] },
  { path: '/timesheets/log', roles: ['EMPLOYEE', 'HUMAN_RESOURCES'] },
  { path: '/timesheets/bulk-log', roles: ['HUMAN_RESOURCES'] },
]

export function allowedRoutesFor(role: RoleCode) {
  return appRoutes.filter((route) => !route.public && (!route.roles || route.roles.includes(role)))
}

export function forbiddenRoutesFor(role: RoleCode) {
  return appRoutes.filter((route) => route.roles && !route.roles.includes(role))
}
