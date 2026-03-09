import { http } from "./http";

export type SalaryRequest = {
  name: string;
  calculateMethod: string;
  isDeduct: boolean;
};
export type SalaryTemplateDetailRequest = {
  salaryCode: string;
  amount: string;
  quantity: string;
  unitCode: string;
  sequenceOrder: string;
};
export type SalaryTemplateRequest = {
  name: string;
  description?: string;
  totalAmount: string;
  effectiveFrom: string;
  effectiveTo: string;
  currency?: string;
  details: SalaryTemplateDetailRequest[];
};
export type SelectionOptionResponse = { code: string; name: string };
export type SelectionOptionQuery = {
  type?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};
export type SalaryTemplateSummary = {
  code?: string;
  name: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  currency?: string;
  totalAmount: string | number;
  createdBy?: string;
};
export type SalaryTemplateListQuery = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  name?: string;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export const salaryService = {
  async listComponents(params?: Record<string, any>) {
    const { data } = await http.get("/api/salaries", { params });
    return data;
  },
  async createComponents(req: SalaryRequest[]) {
    const { data } = await http.post("/api/salaries", req);
    return data;
  },
  async createTemplate(req: SalaryTemplateRequest) {
    const response = await http.post("/api/salary-templates", req);
    return {
      status: response.status,
      data: response.data,
    };
  },
  async salaryOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SelectionOptionResponse[] | any>(
      "/api/salaries/options",
      { params },
    );
    return data;
  },
  async systemUnitOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SelectionOptionResponse[] | any>(
      "/api/system-units/options",
      { params },
    );
    return data;
  },
  async listTemplates(query: SalaryTemplateListQuery = {}) {
    const { data } = await http.get("/api/salary-templates", { params: query });
    return data;
  },
};
