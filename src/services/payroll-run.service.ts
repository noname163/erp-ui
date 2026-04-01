import { http } from "./http";

export type PayrollRunStatus =
  | "DRAFT"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type PayrollRunListQuery = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: string;
};

export type PayrollRunExecuteRequest = Record<string, unknown> | undefined;

export const payrollRunService = {
  async list(query: PayrollRunListQuery = {}) {
    const { data } = await http.get("/api/payroll-runs", { params: query });
    return data;
  },

  async run(payload?: PayrollRunExecuteRequest) {
    const response = await http.post("/api/payroll-runs", payload);
    return {
      status: response.status,
      data: response.data,
    };
  },
};
