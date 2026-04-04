import { AppRoute, type RoleCode } from '@/types'

export type AppNavItem = {
  label: string
  icon: string
  to: string
  roles?: RoleCode[]
  hidden?: boolean
}

export const appNavItems: AppNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    to: AppRoute.DASHBOARD,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'],
  },
  {
    label: 'Calendars',
    icon: 'calendar_today',
    to: AppRoute.CALENDARS,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER', 'HUMAN_RESOURCES'],
  },
  {
    label: 'Companies',
    icon: 'business',
    to: AppRoute.COMPANIES,
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
  {
    label: 'Departments',
    icon: 'apartment',
    to: AppRoute.DEPARTMENTS,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'COMPANY_MANAGER'],
  },
  {
    label: 'HR Overview',
    icon: 'group',
    to: AppRoute.HR_OVERVIEW,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    label: 'Employee Directory',
    icon: 'badge',
    to: AppRoute.EMPLOYEES,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'HUMAN_RESOURCES', 'COMPANY_MANAGER'],
  },
  {
    label: 'Policy Management',
    icon: 'gavel',
    to: AppRoute.PAYROLL_TEMPLATES,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    label: 'New Policy',
    icon: 'add_circle',
    to: AppRoute.PAYROLL_BUILDER,
    roles: ['HUMAN_RESOURCES'],
    hidden: true,
  },
  {
    label: 'Payroll Components',
    icon: 'tune',
    to: AppRoute.PAYROLL_COMPONENTS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    label: 'Payroll Runs',
    icon: 'payments',
    to: AppRoute.PAYROLL_RUNS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    label: 'Payroll Results',
    icon: 'table_view',
    to: AppRoute.PAYROLL_RESULTS,
    roles: ['HUMAN_RESOURCES'],
  },
  {
    label: 'Salary Slips',
    icon: 'receipt_long',
    to: AppRoute.SALARY_SLIP_LIST,
    roles: ['HUMAN_RESOURCES', 'COMPANY_MANAGER', 'EMPLOYEE'],
  },
  {
    label: 'Authentication',
    icon: 'verified_user',
    to: AppRoute.RESET_PASSWORD,
    hidden: true,
  },
  {
    label: 'Working Logs',
    icon: 'history',
    to: AppRoute.LOG_WORK_LIST,
    roles: ['EMPLOYEE', 'HUMAN_RESOURCES'],
  },
  {
    label: 'Bulk Log Work',
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
