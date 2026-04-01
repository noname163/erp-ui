import { http } from "./http";

export type PayrollResultSourceType =
  | "RUNNING"
  | "PREVIEW"
  | "FINALIZED"
  | "ADJUSTMENT";

export type PayrollResultListQuery = {
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
    const { data } = await http.get("/api/payroll-results", { params: query });
    return data;
  },
};
