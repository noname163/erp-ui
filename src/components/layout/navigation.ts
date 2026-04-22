import { AppRoute, type RoleCode } from '@/types'

export type AppNavItem = {
  labelKey: string
  icon: string
  to: string
  roles?: RoleCode[]
  hidden?: boolean
}

export const appNavItems: AppNavItem[] = [
  {
    labelKey: 'navigation.dashboard',
    icon: 'dashboard',
    to: AppRoute.DASHBOARD,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'],
  },
  {
    labelKey: 'navigation.calendars',
    icon: 'calendar_today',
    to: AppRoute.CALENDARS,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER', 'HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.companies',
    icon: 'business',
    to: AppRoute.COMPANIES,
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
  {
    labelKey: 'navigation.departments',
    icon: 'apartment',
    to: AppRoute.DEPARTMENTS,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'],
  },
  {
    labelKey: 'navigation.hrOverview',
    icon: 'group',
    to: AppRoute.HR_OVERVIEW,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.employeeDirectory',
    icon: 'badge',
    to: AppRoute.EMPLOYEES,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'HUMAN_RESOURCES', 'COMPANY_MANAGER'],
  },
  {
    labelKey: 'navigation.policyManagement',
    icon: 'gavel',
    to: AppRoute.PAYROLL_POLICIES,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.salaryTemplate',
    icon: 'article',
    to: AppRoute.PAYROLL_TEMPLATES,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.newPolicy',
    icon: 'add_circle',
    to: AppRoute.PAYROLL_BUILDER,
    roles: ['HUMAN_RESOURCES'],
    hidden: true,
  },
  {
    labelKey: 'navigation.payrollComponents',
    icon: 'tune',
    to: AppRoute.PAYROLL_COMPONENTS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.payrollRuns',
    icon: 'payments',
    to: AppRoute.PAYROLL_RUNS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.payrollResults',
    icon: 'table_view',
    to: AppRoute.PAYROLL_RESULTS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.salarySlips',
    icon: 'receipt_long',
    to: AppRoute.SALARY_SLIP_LIST,
    roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER', 'EMPLOYEE'],
  },
  {
    labelKey: 'navigation.authentication',
    icon: 'verified_user',
    to: AppRoute.RESET_PASSWORD,
    hidden: true,
  },
  {
    labelKey: 'navigation.workingLogs',
    icon: 'history',
    to: AppRoute.LOG_WORK_LIST,
    roles: ['EMPLOYEE', 'HUMAN_RESOURCES'],
  },
  {
    labelKey: 'navigation.bulkLogWork',
    icon: 'playlist_add',
    to: AppRoute.BULK_LOG_WORK,
    roles: ['HUMAN_RESOURCES'],
  },
]

export function canSeeNavItem(item: AppNavItem, role: RoleCode | null) {
  if (!item.roles) return true
  if (!role) return false
  return item.roles.includes(role)
}

export function isNavItemActive(item: AppNavItem, path: string) {
  if (path === item.to) return true
  if (item.to === AppRoute.LOGIN) return false
  return path.startsWith(`${item.to}/`)
}

export function findCurrentNavItem(path: string) {
  return appNavItems.find((item) => isNavItemActive(item, path)) ?? null
}
