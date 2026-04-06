import type { RoleCode } from '@/types'

const roleKeyByCode: Record<RoleCode, string> = {
  SYSTEM_ADMIN: 'common.role.systemAdmin',
  ADMIN: 'common.role.admin',
  COMPANY_MANAGER: 'common.role.companyManager',
  HUMAN_RESOURCES: 'common.role.humanResources',
  EMPLOYEE: 'common.role.employee',
}

export function translateRole(t: (key: string) => string, role: RoleCode | null | undefined) {
  if (!role) return t('common.notSelected')
  return t(roleKeyByCode[role])
}
