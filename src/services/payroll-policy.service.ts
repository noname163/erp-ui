import { http } from "./http";
export type SelectionOptionResponse = { code: string; name: string };
export type PayrollPolicyRequest = {
  name: string;
  standardQuantityPerDay: number;
  unitCode?: string;
  standardStartTime?: string;
  standardEndTime?: string;
  statutorySettings?: { jurisdiction: string; weekdayOvertimeMultiplier?: number; restDayOvertimeMultiplier?: number; holidayOvertimeMultiplier?: number; nightWorkPremium?: number; [key: string]: unknown };
  roundingRule?: string;
  effectiveFrom: string;
  effectiveTo?: string;
};
export type PayrollPolicyResponse = {
  code: string;
  name: string;
  standardQuantityPerDay?: number | null;
  unitCode?: string | null;
  standardStartTime?: string | null;
  standardEndTime?: string | null;
  roundingRule?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
};
export type PayrollPolicyListQuery = {
  name?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  unitCode?: string;
};
export type ApplyPayrollPolicyEmployeesRequest = {
  policyCode: string;
  employeeCodes: string[];
  effectiveFrom: string;
  effectiveTo?: string;
};
export type SelectionOptionQuery = {
  type?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};
export const payrollPolicy = {
  async createPayrollPolicy(req: PayrollPolicyRequest) {
    const response = await http.post("/api/payroll-policies", req);
    return {
      status: response.status,
      data: response.data,
    };
  },
  async listPayrollPolicies(params?: PayrollPolicyListQuery) {
    const { data } = await http.get<PayrollPolicyResponse[] | any>(
      "/api/payroll-policies",
      { params },
    );
    return data;
  },
  async applyEmployees(req: ApplyPayrollPolicyEmployeesRequest) {
    const response = await http.post(
      "/api/v1/employee-payroll-policies/apply",
      req,
    );
    return {
      status: response.status,
      data: response.data,
    };
  },
  async systemUnitOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SelectionOptionResponse[] | any>(
      "/api/system-units/options",
      { params },
    );
    return data;
  },
};
