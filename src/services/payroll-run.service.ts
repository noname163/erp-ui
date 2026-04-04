import { http } from "./http";

export type PayrollRunStatus = "OPEN" | "CALCULATED" | "CLOSED" | "FAILED";

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
};
