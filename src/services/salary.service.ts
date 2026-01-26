import { http } from './http'

export type SalaryRequest = { name: string; calculateMethod: string; isDeduct: boolean }
export type SalaryTemplateDetailRequest = { salaryCode: string; amount: string; quantity: string; unitCode: string; sequenceOrder: string }
export type SalaryTemplateRequest = { name: string; description?: string; totalAmount: string; effectiveFrom: string; effectiveTo: string; currency?: string; details: SalaryTemplateDetailRequest[] }

export const salaryService = {
  async createComponents(req: SalaryRequest[]) {
    const { data } = await http.post('/api/salaries', req)
    return data
  },
  async createTemplate(req: SalaryTemplateRequest) {
    const { data } = await http.post('/api/salary-templates', req)
    return data
  },
}
