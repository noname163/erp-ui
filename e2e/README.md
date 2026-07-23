# ERP HR E2E Automation

This folder contains Playwright automation for role flows, permissions, payroll, and working logs.

## Coverage

- Role navigation for:
  - `SYSTEM_ADMIN`
  - `ADMIN`
  - `COMPANY_MANAGER`
  - `HUMAN_RESOURCES`
  - `EMPLOYEE`
- UI route guards for forbidden pages.
- HR payroll APIs:
  - payroll run list
  - missing/invalid `runDate`
  - payroll result actual amount/quantity regression
- Working log APIs:
  - invalid date range
  - PTO filter compatibility
  - PTO paid leave without fake time regression
- Optional mutation flow:
  - create payroll run when `E2E_ALLOW_MUTATION=true`

## Accounts

Copy `e2e/test-accounts.example.json` to `e2e/test-accounts.local.json` and fill role credentials.

`e2e/test-accounts.local.json` is ignored by git.

Environment variables can override the local file:

```powershell
$env:E2E_HUMAN_RESOURCES_EMAIL="danghuudat163+hr@gmail.com"
$env:E2E_HUMAN_RESOURCES_PASSWORD="D@t163163"
$env:E2E_EMPLOYEE_EMAIL="employee@example.com"
$env:E2E_EMPLOYEE_PASSWORD="password"
```

Missing role accounts are skipped automatically, so the suite can run with only the HR account while other role credentials are not available.

## Endpoints

Defaults:

- UI: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8080`

Override when needed:

```powershell
$env:E2E_BASE_URL="http://localhost:5173"
$env:E2E_API_BASE_URL="http://localhost:8080"
```

## Run

Start backend and frontend first, then run:

```powershell
npm run test:e2e
npm run test:e2e:report:md
```

## Payroll Data Preparation Flow

Use this when you need a complete payroll-ready dataset before manual UI testing.

```powershell
npm run test:e2e:prep:payroll
```

The flow creates:

- company calendar for the payroll month when possible
- department
- employee account
- fixed test password for that employee
- salary components
- salary template
- employee salary assignment
- payroll policy
- pay-rate rules for normal/weekend/holiday through DB helper
- employee payroll policy assignment
- daily working logs: normal, late, OT, PTO paid, weekend work, holiday work

Default output:

```text
e2e-report/payroll-data-prep/latest.md
e2e-report/payroll-data-prep/latest.json
```

Default employee password:

```text
Test@123456
```

Configure the payroll month:

```powershell
$env:E2E_PREP_PAYROLL_MONTH="2026-09"
npm run test:e2e:prep:payroll
```

The password patch and pay-rate insertion use Java + the local PostgreSQL JDBC jar from the backend Maven cache. DB settings default to `../erp/.env`; override them when needed:

```powershell
$env:E2E_DB_URL="jdbc:postgresql://localhost:5432/erp"
$env:E2E_DB_USERNAME="postgres"
$env:E2E_DB_PASSWORD="admin"
```

Skip DB patching only when you accept that the employee password will be the backend-generated email password and pay-rate rules may be missing:

```powershell
$env:E2E_PREP_SKIP_DB_PATCH="true"
npm run test:e2e:prep:payroll
```

Open the HTML report:

```powershell
npm run test:e2e:report
```

Markdown report:

```text
e2e-report/latest.md
```

## Mutation Tests

By default, tests avoid creating new payroll runs. Enable data-changing flow explicitly:

```powershell
$env:E2E_ALLOW_MUTATION="true"
npm run test:e2e
```

Use these optional data values for targeted payroll/working-log assertions:

```powershell
$env:E2E_PAYROLL_RUN_CODE="PRN-000013"
$env:E2E_PAYROLL_RUN_MONTH="2026-08"
$env:E2E_DAILY_WORK_EMPLOYEE_CODE="USR-QA-AUG-TPL-8H"
```

## Current Expected Failures

The suite intentionally asserts the correct business behavior. In the current system state, these tests are expected to fail until the bugs are fixed:

- Calculated payroll results must have non-null `actualAmount` and `actualQuantity`.
- Missing/invalid payroll `runDate` should return `400`, not `500`.
- Working Logs UI PTO filter must be compatible with backend filtering.
- PTO paid leave should be loggable without fake start/end time.
