export enum AppRoute {
  LOGIN = "/",
  RESET_PASSWORD = "/reset-password",
  DASHBOARD = "/dashboard",
  COMPANIES = "/companies",
  CREATE_COMPANY = "/companies/new",
  DEPARTMENTS = "/departments",
  EMPLOYEES = "/employees",
  CREATE_EMPLOYEE = "/employees/new",
  HR_OVERVIEW = "/hr",
  PAYROLL_TEMPLATES = "/payroll/templates",
  PAYROLL_BUILDER = "/payroll/builder",
  PAYROLL_COMPONENTS = "/payroll/components",
  SALARY_SLIP = "/salary/slip",
  SALARY_SLIP_LIST = "/salary/slips",
  LOG_WORK = "/timesheets/log",
  BULK_LOG_WORK = "/timesheets/bulk-log",
}

export type RoleCode =
  | "SYSTEM_ADMIN"
  | "HUMAN_RESOURCES"
  | "COMPANY_MANAGER"
  | "EMPLOYEE"
  | "ADMIN";

export interface UserProfile {
  email: string;
  fullName?: string;
  role?: RoleCode;
  roles?: RoleCode[];
}

export interface Company {
  code: string;
  name: string;
  email: string;
  industry: string;
  taxNumber: string;
  address: string;
  phoneNumber: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  status?: string;
  companyCode?: string;
  companyName?: string;
}

export interface Paged<T> {
  content?: T[];
  data?: T[]; // backend might use different wrappers
  totalElements?: number;
  totalPages?: number;
  page?: number;
  size?: number;
}
