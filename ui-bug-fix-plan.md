# UI Bug Fix Plan

## Summary
- Create one markdown plan document at repo root named `ui-bug-fix-plan.md`.
- Cover every unresolved CSV row whose `Type` contains `UI Bug`.
- For mixed `Backend Bug, UI Bug` rows, include the frontend file changes first and call out the backend dependency where UI alone cannot enforce the rule.

## Planned Changes
| Bug | Files to change | Fix summary |
| --- | --- | --- |
| Employee list display incorrect when no data | `src/pages/EmployeeListPage.vue`, `src/i18n/messages/{en,vi,zh-TW}.ts` | Normalize empty/invalid API payloads to `[]`, clear stale rows, and show a dedicated empty state instead of placeholder or "unknown" employee content. |
| Unable to open the filter option | `src/pages/EmployeeListPage.vue` | Replace the inert filter button with a real open/close advanced-filter panel and apply client-side filters for name, age, department, skills, and status. |
| Unable to create new calendar | `src/pages/CalendarBuilderPage.vue`, `src/i18n/messages/{en,vi,zh-TW}.ts` | Add frontend validation for past `effectiveFrom` values and show a clear invalid-past-date message before submit instead of a raw backend error. |
| The create and update calendar to difficult | `src/pages/CalendarBuilderPage.vue`, `src/components/calendar/CalendarMonthGrid.vue`, `src/services/calendar.service.ts` | Add a batch-assign flow that applies the selected day type to a chosen date range instead of forcing one-day-at-a-time clicks. |
| Salary slips list display incorrect | `src/pages/SalarySlipListPage.vue`, `src/router/index.ts` | Make the filter area collapsible, hide employee-search and create actions for `EMPLOYEE`, and redirect `EMPLOYEE` away from `/salary/slip` back to `/salary/slips`. |
| Working logs display not correct | `src/types.ts`, `src/stores/auth.ts`, `src/pages/LogWorkListPage.vue` | Persist the current user's profile code in auth state, make the filter area collapsible, lock employee filtering for `EMPLOYEE`, and fix the table cell binding so the log-date column renders correctly. |
| Employee able to create working log for other employees | `src/types.ts`, `src/stores/auth.ts`, `src/pages/LogWorkPage.vue` | Prefill the current employee, disable the employee selector for `EMPLOYEE`, and keep the full selector only for `HUMAN_RESOURCES`. |
| App bar display incorrect | `src/components/layout/navigation.ts`, `src/i18n/messages/{en,vi,zh-TW}.ts` | Create a new HR-only nav item labeled `Salary Template` that points to `AppRoute.PAYROLL_TEMPLATES`; keep the existing HR nav items unchanged. |
| Selection option in salary component display incorrect | `src/pages/SalaryComponentsBuilderPage.vue` | Make the modal card overflow-visible and scroll-safe so the calculate-method select can display and scroll through all options. |
| The total amount in salary template builder does not correct | `src/pages/SalaryTemplateBuilderPage.vue`, `src/services/salary.service.ts` | Replace raw amount summation with a shared derived-total helper that uses salary-component method and deduction metadata before updating `template.totalAmount`. |
| The total amount in salary template list does not correct | `src/pages/SalaryTemplateListPage.vue`, `src/services/salary.service.ts` | Reuse the same derived-total helper in the list page, fetching visible-row template details once per page and caching by template code so displayed totals match builder logic. |

## Interfaces / Types
- Extend `UserProfile` in `src/types.ts` and auth extraction in `src/stores/auth.ts` to retain `userProfileCode`.
- Add shared salary-component metadata and total-calculation helpers in `src/services/salary.service.ts` so builder and list screens use one totaling rule.
- Update `src/router/index.ts` so `EMPLOYEE` cannot enter the salary-slip creation route directly.

## Test Plan
- Employee list: empty API response shows only the empty state; filter button toggles the panel; each advanced filter narrows rows correctly.
- Calendar builder: past-date submission is blocked with the new message; range assignment updates all dates in the chosen range in month, quarter, and year views.
- Salary slips list: `EMPLOYEE` cannot see create or employee-search UI; filter button opens/closes the filter area; direct `/salary/slip` navigation redirects to `/salary/slips`.
- Working log list/create: `EMPLOYEE` is scoped to self on list and create screens; HR still sees full employee selection; log-date column renders correctly.
- Navigation: `HUMAN_RESOURCES` sees a new `Salary Template` nav item alongside the existing HR menu entries.
- Salary components/templates: dropdowns inside modals are fully visible and scrollable; builder and list totals match deduction and ratio rules.

## Assumptions
- Include all unresolved rows where `Type` contains `UI Bug`, including mixed backend/UI rows and the calendar row whose `Status` is `Enhance`.
- The new `Salary Template` nav item is an additional HR menu entry, not a rename or replacement of an existing nav item.
- Formula-based salary components remain backend-evaluated; the shared UI total helper covers fixed, plus, minus, and percent-based rows.
- The login payload can expose a stable `userProfileCode`; if it cannot, the working-log self-scope items need a small backend "current profile" endpoint before implementation.
