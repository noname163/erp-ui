import { http } from "./http";

export type PayrollResultSourceType =
  | "RUNNING"
  | "PREVIEW"
  | "FINALIZED"
  | "ADJUSTMENT";

export type PayrollResultListResponse = {
  id?: string | number;
  code?: string;
  payrollResultCode?: string;
  resultCode?: string;
  payrollRunCode?: string | null;
  period?: string | null;
  createdAt?: string | null;
  createdDate?: string | null;
  updatedAt?: string | null;
  salaryName?: string | null;
  name?: string | null;
  salaryCode?: string | null;
  salaryComponentName?: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  expectedAmount?: number | string | null;
  amountExpected?: number | string | null;
  plannedAmount?: number | string | null;
  originalAmount?: number | string | null;
  actualAmount?: number | string | null;
  amountActual?: number | string | null;
  amount?: number | string | null;
  finalAmount?: number | string | null;
  currency?: string | null;
  currencyCode?: string | null;
  expectedQty?: number | string | null;
  quantityExpected?: number | string | null;
  expectedQuantity?: number | string | null;
  plannedQty?: number | string | null;
  actualQty?: number | string | null;
  quantityActual?: number | string | null;
  actualQuantity?: number | string | null;
  finalQty?: number | string | null;
  quantity?: number | string | null;
  unit?: string | null;
  unitName?: string | null;
  unitCode?: string | null;
  sourceType?: PayrollResultSourceType | string | null;
  resultSourceType?: PayrollResultSourceType | string | null;
  source?: string | null;
  status?: string | null;
  isRetro?: boolean | string | number | null;
  retro?: boolean | string | number | null;
  hasRetro?: boolean | string | number | null;
  isRetroAdjustment?: boolean | string | number | null;
  retroReason?: string | number | null;
  retroAdjustmentReason?: string | number | null;
  reason?: string | number | null;
  adjustmentReason?: string | number | null;
};

export type PayrollResultListQuery = {
  payrollRunCode?: string;
  createdDate?: string;
  sourceType?: PayrollResultSourceType;
  employeeKeyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};

export const payrollResultService = {
  async list(query: PayrollResultListQuery = {}) {
    const { data } = await http.get<PayrollResultListResponse[] | any>("/api/payroll-results", { params: query });
    return data;
  },
};
