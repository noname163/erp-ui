import { expect, test, type Page } from '@playwright/test'

const line = (kind: string, label: string, amount: number, formula: string, currency = 'VND') => ({kind,label,amount,formula,currency})
const payslip = { period:'2026-09', currency:'VND', expectedAmount:32000000, grossEarnings:35000000, totalDeductions:4174000, netPay:30826000, policyName:'Vietnam standard', policyCode:'POL-1', policyEffectiveFrom:'2026-01-01', statutoryVersion:'VN-2026-07', inputVersion:'INPUT-1', hours:{'Expected hours':160,'Regular worked hours':152,'Paid leave':8,'Overtime':10}, lines:[line('EARNING','Regular earnings',32000000,'160 hours × 200000'),line('EARNING','Weekday overtime',3000000,'10 × 200000 × 1.5'),line('DEDUCTION','Social insurance',2560000,'32000000 VND × 8%'),line('DEDUCTION','Health insurance',480000,'32000000 VND × 1.5%'),line('DEDUCTION','Unemployment insurance',320000,'32000000 VND × 1%'),line('DEDUCTION','Personal income tax',814000,'500000 + 314000'),line('TAX_BAND','Tax band above 10000000',314000,'3140000 × 10%'),line('INFO','Paid leave',0,'Included in payable hours; no additional payment'),line('EMPLOYER','Employer social insurance',5600000,'Not deducted from pay')], notes:['Unpaid leave already reduces payable hours.'] }
async function open(page: Page, snapshot: unknown = payslip) {
  await page.addInitScript(() => {
    localStorage.setItem('erp.auth',JSON.stringify({isAuthenticated:true,user:{name:'Payroll tester',roles:['HUMAN_RESOURCES']},roles:['HUMAN_RESOURCES']}))
    localStorage.setItem('erp.role','HUMAN_RESOURCES');localStorage.setItem('erp.locale','en')
  })
  await page.route('**/api/**',async route => {
    const url=new URL(route.request().url())
    if(url.pathname==='/api/payroll-results') return route.fulfill({json:{data:[{payrollResultCode:'RESULT-1',payrollRunCode:'RUN-1',employeeCode:'EMP-1',employeeName:'Nguyen An',period:'2026-09',currency:'VND',expectedAmount:'32000000',actualAmount:'30826000',expectedQuantity:160,actualQuantity:160,unitName:'HOUR',sourceType:'FINALIZED'}],totalElements:1,totalPages:1}})
    if(url.pathname==='/api/payroll-payslips/RESULT-1') return route.fulfill({json:{payslip:snapshot,period:'2026-09',currency:'VND',inputs:null,message:snapshot?null:'No saved monthly calculation is available. Confirm payroll setup, then rerun payroll.'}})
    return route.fulfill({json:{data:[]}})
  })
  await page.goto('/payroll/results?payrollRunCode=RUN-1')
  await page.getByTitle('View detail').click()
}
test('monthly payslip explains formulas and reconciles net pay',async ({page})=>{
  await open(page)
  const dialog=page.getByRole('dialog')
  await expect(dialog.getByRole('heading',{name:'Monthly payslip'})).toBeVisible()
  await expect(dialog.getByText('10 × 200000 × 1.5',{exact:true})).toBeVisible()
  await expect(dialog.getByText('Tax calculation in VND',{exact:true})).toBeVisible()
  await expect(dialog.getByText('Employer contributions (paid by the company)',{exact:true})).toBeVisible()
  await expect(dialog.getByText('35,000,000 VND − 4,174,000 VND = 30,826,000 VND',{exact:true})).toBeVisible()
  await page.screenshot({path:'test-results/monthly-payslip-desktop.png',fullPage:true})
})
test('legacy result offers setup without inventing a payslip',async ({page})=>{
  await open(page,null)
  await expect(page.getByRole('dialog')).toContainText('No saved monthly calculation')
  await expect(page.getByText('Take-home pay',{exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Payroll setup',exact:true}).click()
  await expect(page.getByLabel('Monthly insurance salary (VND)',{exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Save confirmed payroll inputs'})).toBeVisible()
})
test('payslip is usable on a narrow screen',async ({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page)
  const dialog=page.getByRole('dialog');await expect(dialog.getByText('Take-home pay',{exact:true})).toBeVisible()
  expect(await dialog.locator('section').first().evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy()
  await page.screenshot({path:'test-results/monthly-payslip-mobile.png',fullPage:true})
})
