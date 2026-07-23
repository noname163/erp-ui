import { http } from "./http";

export type PayrollRunStatus =
  | "OPEN"
  | "DRAFT"
  | "PROCESSING"
  | "CALCULATED"
  | "COMPLETED"
  | "PARTIAL_FAILED"
  | "CLOSED"
  | "FAILED"
  | "RERUNNING";

export type PayrollRerunMode = "FULL_RUN" | "SELECTED_EMPLOYEES" | "FAILED_ONLY";

export type PayrollRerunRequest = {
  reason: string;
  employeeCodes?: string[];
  mode: PayrollRerunMode;
  dryRun: boolean;
};

export type PayrollRunListQuery = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  status?: string;
};

export const payrollRunService = {
  async list(query: PayrollRunListQuery = {}) {
    const { data } = await http.get("/api/payroll-runs", { params: query });
    return data;
  },

  async run(runDate: string) {
    const response = await http.post("/api/payroll-runs", null, {
      params: { runDate },
    });
    return {
      status: response.status,
      data: response.data,
    };
  },

  async rerun(payrollRunCode: string, payload: PayrollRerunRequest) {
    const { data } = await http.post(`/api/payroll-runs/${payrollRunCode}/rerun`, payload);
    return data;
  },
};
