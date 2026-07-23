import { createRouter, createWebHistory } from "vue-router";
import { AppRoute, type RoleCode } from "@/types";
import { useAuthStore } from "@/stores/auth";

import LoginPage from "@/pages/LoginPage.vue";
import DashboardPage from "@/pages/DashboardPage.vue";
import CalendarListPage from "@/pages/CalendarListPage.vue";
import CalendarBuilderPage from "@/pages/CalendarBuilderPage.vue";
import CompanyListPage from "@/pages/CompanyListPage.vue";
import CreateCompanyPage from "@/pages/CreateCompanyPage.vue";
import DepartmentManagementPage from "@/pages/DepartmentManagementPage.vue";
import HRDashboardPage from "@/pages/HRDashboardPage.vue";
import SalarySlipPage from "@/pages/SalarySlipPage.vue";
import LogWorkListPage from "@/pages/LogWorkListPage.vue";
import LogWorkPage from "@/pages/LogWorkPage.vue";
import BulkLogWorkPage from "@/pages/BulkLogWorkPage.vue";
import SalaryTemplateBuilderPage from "@/pages/SalaryTemplateBuilderPage.vue";
import SalaryTemplateListPage from "@/pages/SalaryTemplateListPage.vue";
import PayrollRunListPage from "@/pages/PayrollRunListPage.vue";
import PayrollResultListPage from "@/pages/PayrollResultListPage.vue";
import SalaryComponentsBuilderPage from "@/pages/SalaryComponentsBuilderPage.vue";
import CreateEmployeePage from "@/pages/CreateEmployeePage.vue";
import EmployeeListPage from "@/pages/EmployeeListPage.vue";
import ResetPasswordPage from "@/pages/ResetPasswordPage.vue";
import SalarySlipListPage from "@/pages/SalarySlipListPage.vue";
import PolicyListPage from "@/pages/PolicyListPage.vue";
import PolicyBuilderPage from "@/pages/PolicyBuilderPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: AppRoute.LOGIN, component: LoginPage, meta: { public: true } },

    {
      path: AppRoute.RESET_PASSWORD,
      component: ResetPasswordPage,
      meta: { auth: true },
    },

    {
      path: AppRoute.DASHBOARD,
      component: DashboardPage,
      meta: {
        auth: true,
        roles: [
          "SYSTEM_ADMIN",
          "ADMIN",
          "COMPANY_MANAGER",
        ] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.CALENDARS,
      component: CalendarListPage,
      meta: {
        auth: true,
        roles: [
          "SYSTEM_ADMIN",
          "ADMIN",
          "COMPANY_MANAGER",
          "HUMAN_RESOURCES",
        ] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.CALENDAR_BUILDER,
      component: CalendarBuilderPage,
      meta: {
        auth: true,
        roles: [
          "SYSTEM_ADMIN",
          "ADMIN",
          "COMPANY_MANAGER",
          "HUMAN_RESOURCES",
        ] satisfies RoleCode[],
      },
    },

    {
      path: AppRoute.COMPANIES,
      component: CompanyListPage,
      meta: {
        auth: true,
        roles: ["SYSTEM_ADMIN", "ADMIN"] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.CREATE_COMPANY,
      component: CreateCompanyPage,
      meta: {
        auth: true,
        roles: ["SYSTEM_ADMIN", "ADMIN"] satisfies RoleCode[],
      },
    },

    {
      path: AppRoute.DEPARTMENTS,
      component: DepartmentManagementPage,
      meta: {
        auth: true,
        roles: [
          "SYSTEM_ADMIN",
          "ADMIN",
          "COMPANY_MANAGER",
        ] satisfies RoleCode[],
      },
    },

    {
      path: AppRoute.HR_OVERVIEW,
      component: HRDashboardPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.EMPLOYEES,
      component: EmployeeListPage,
      meta: {
        auth: true,
        roles: [
          "SYSTEM_ADMIN",
          "ADMIN",
          "COMPANY_MANAGER",
          "HUMAN_RESOURCES",
        ] satisfies RoleCode[],
      },
    },

    {
      path: AppRoute.CREATE_EMPLOYEE,
      component: CreateEmployeePage,
      meta: {
        auth: true,
        roles: ["HUMAN_RESOURCES", "COMPANY_MANAGER"] satisfies RoleCode[],
      },
    },

    {
      path: AppRoute.PAYROLL_COMPONENTS,
      component: SalaryComponentsBuilderPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.PAYROLL_TEMPLATES,
      component: SalaryTemplateListPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.PAYROLL_RUNS,
      component: PayrollRunListPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.PAYROLL_RESULTS,
      component: PayrollResultListPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.PAYROLL_BUILDER,
      component: SalaryTemplateBuilderPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
        path: AppRoute.PAYROLL_POLICIES,
        component: PolicyListPage,
        meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
        path: AppRoute.PAYROLL_POLICY_BUILDER,
        component: PolicyBuilderPage,
        meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
    {
      path: AppRoute.SALARY_SLIP,
      component: SalarySlipPage,
      meta: {
        auth: true,
        roles: [
          "HUMAN_RESOURCES",
          "COMPANY_MANAGER",
          "EMPLOYEE",
        ] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.SALARY_SLIP_LIST,
      component: SalarySlipListPage,
      meta: {
        auth: true,
        roles: [
          "HUMAN_RESOURCES",
          "COMPANY_MANAGER",
          "EMPLOYEE",
        ] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.LOG_WORK_LIST,
      component: LogWorkListPage,
      meta: {
        auth: true,
        roles: ["EMPLOYEE", "HUMAN_RESOURCES"] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.LOG_WORK,
      component: LogWorkPage,
      meta: {
        auth: true,
        roles: ["EMPLOYEE", "HUMAN_RESOURCES"] satisfies RoleCode[],
      },
    },
    {
      path: AppRoute.BULK_LOG_WORK,
      component: BulkLogWorkPage,
      meta: { auth: true, roles: ["HUMAN_RESOURCES"] satisfies RoleCode[] },
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated && auth.user === null) auth.hydrate();

  if (to.meta.public) return true;
  if (to.meta.auth && !auth.isAuthenticated) return AppRoute.LOGIN;

  const roles = to.meta.roles as RoleCode[] | undefined;
  const activeRole = auth.ensureRole(roles);
  if (roles && activeRole && !roles.includes(activeRole))
    return homeForRole(activeRole);
  if (roles && !activeRole) {
    auth.logout();
    return AppRoute.LOGIN;
  }
  if (to.path === AppRoute.SALARY_SLIP && activeRole === "EMPLOYEE") {
    return AppRoute.SALARY_SLIP_LIST;
  }

  return true;
});

export default router;

function homeForRole(role: RoleCode) {
  if (role === "HUMAN_RESOURCES") return AppRoute.HR_OVERVIEW;
  if (role === "EMPLOYEE") return AppRoute.LOG_WORK_LIST;
  return AppRoute.DASHBOARD;
}
