# Frontend Data Contracts

This document records the frontend contracts for the home dashboard date filter, anomaly table, and B2B vs B2C comparison. Endpoint paths, query names, response schemas, and API constraints below were checked against the running FastAPI `/docs` OpenAPI document. Runtime examples are illustrative; the generated dataset's date bounds change over time.

Type definitions live in [api-types.ts](api-types.ts) and [param-types.ts](param-types.ts). Component and display-state requirements live in [components.md](components.md).

## Shared Date Range

`DateRangeFilter` contains optional `start_date` and `end_date` strings. Each non-empty value must be a valid calendar date formatted `YYYY-MM-DD`. The API includes both bounds. Omit an unset parameter from the query string. The API validates each date, but does not reject a start date later than the end date; the frontend must prevent that range and show an inline validation error.

`GET /api/metrics/facets` takes no query parameters and returns `FacetsResponse`:

| Property | Type | Contract |
| --- | --- | --- |
| `operation_types` | `OperationType[]` | Values are `income` or `outcome`. |
| `business_types` | `BusinessType[]` | Values are `B2B` or `B2C`. |
| `categories` | `Category[]` | Shared category values: `suppliers`, `sales`, `operational`, `administrative`, `others`. Not split by business type. |
| `min_date` | `string` | Earliest available date, `YYYY-MM-DD`. |
| `max_date` | `string` | Latest available date, `YYYY-MM-DD`. |

An observed response was `{"operation_types":["income","outcome"],"business_types":["B2B","B2C"],"categories":["administrative","operational","others","sales","suppliers"],"min_date":"2025-10-02","max_date":"2026-09-28"}`. Treat the date values as dynamic, not constants.

## Feature 1: Home Dashboard Date Filter

**Endpoints and types**

| Method and path | Request type | Response type | Use |
| --- | --- | --- | --- |
| `GET /api/metrics/facets` | No parameters | `FacetsResponse` | Read `min_date` and `max_date` for the date inputs. |
| `GET /api/metrics` | `DateRangeFilter` plus optional API filters | `MetricsResponse` (`FinancialMovementEntry[]`) | Fetch home dashboard movements for the selected inclusive date range. |

The verified `GET /api/metrics` query parameters are optional `start_date` and `end_date` (date strings), `category` (`suppliers`, `sales`, `operational`, `administrative`, or `others`), and `operation_type` (`income` or `outcome`). The date-filter feature sends only the date fields. A response entry has `create_date: string` (`YYYY-MM-DD`), `amount: number`, `operation_type: OperationType`, `category: Category`, and `business_type: BusinessType`.

**Edge cases the UI must show**

- Both inputs blank: omit both query parameters and show all available data.
- Only one input set: send only that inclusive bound.
- Start equals end: allow it and request that single day.
- Start after end or a date outside the displayed facet bounds: block submission and show inline validation; do not send the invalid range.
- No movements for a valid range: retain the dashboard layout and show its no-data state rather than hiding charts or KPIs.
- Facets request failure: show a visible error and retry action; do not display invented reference bounds.

## Feature 2: Anomaly Alerts Table

**Verified endpoint contracts**

| Method and path | Query parameters | Response type | Contract |
| --- | --- | --- | --- |
| `GET /api/metrics/summary` | `group_by` (`day`, `week`, `month`; default `month`), optional `start_date`, `end_date`, `category`, `operation_type`, `business_type` | `MetricsSummaryResponse` (`MetricsSummaryEntry[]`) | Each entry has `period`, `income`, `outcome`, and `net`, all required; amount fields are numbers. |
| `GET /api/metrics/alerts` | `threshold` (number, minimum `0`, default `0.3`), `group_by` (`day`, `week`, `month`; default `month`), optional `start_date`, `end_date`, `business_type` (`B2B`, `B2C`) | `AlertResponse` (`AlertEntry[]`) | Each entry has `period`, `outcome_total`, `baseline_average`, and `increase_ratio`, all required. Empty results are `[]`. |

The `/alerts` schema does not encode the meaning of its baseline. The verified implementation compares each period against the mean of all previous periods, and emits rows only when `increase_ratio > threshold`. That is not the PM-requested rolling average of the previous three periods. Therefore, **do not use `/api/metrics/alerts` as the table source**. Use monthly `/api/metrics/summary` data and derive `AnomalyRow` values in the frontend. This is the exact behavior the frontend can implement without presenting the wrong average.

**Request and calculation contract**

- Request `group_by=month` and `operation_type=outcome`. Pass the active date range to the summary request. Expand only the summary request's start back to include the three calendar months before the first visible month; keep displayed anomaly rows inside the selected date range. Without a selected start, use the earliest period available from facets.
- For each visible month, `rolling_average` is the arithmetic mean of the immediately preceding three calendar months' `outcome` totals. Missing months inside the dataset's available date span count as zero. Months without three prior periods are not evaluated.
- Calculate `increase_ratio = (outcome_total - rolling_average) / rolling_average`. Show an anomaly only when `increase_ratio > threshold`. The threshold control's UI range is `0.01` through `1.0`, inclusive, and its default is `0.3`; these are product constraints stricter than the API's `threshold >= 0` constraint. The threshold is applied locally to the rolling calculation, not sent to `/api/metrics/summary`.
- Skip a month when `rolling_average` is zero. Display `increase_ratio * 100` as the percentage column.

**Types**

- Raw alerts endpoint: `AlertsParams` and `AlertResponse` (`AlertEntry[]`). `AlertEntry` uses the verified backend field names and its `baseline_average` is cumulative-history, not rolling.
- Table source: `MetricsSummaryParams` and `MetricsSummaryResponse` (`MetricsSummaryEntry[]`).
- Rendered row: `AnomalyRow` (`period`, `outcome_total`, `rolling_average`, `increase_ratio`).
- Shared date fields: `DateRangeFilter`.

**Edge cases the UI must show**

- No detected rows: show `No spending anomalies found for this date range and threshold.` in a visible table empty state.
- Fewer than three prior months: omit untestable months; if no month can be evaluated, show `Not enough history to evaluate anomalies.`
- A zero rolling average: do not divide by zero or create an infinite percentage; omit that candidate.
- A summary request failure: show a request error and retry action, not the successful empty state.

## Feature 3: B2B vs B2C Comparison

**Endpoints and types**

| Method and path | Query parameters used | Response type | Use |
| --- | --- | --- | --- |
| `GET /api/metrics/facets` | None | `FacetsResponse` | Supply shared category values and date bounds. |
| `GET /api/metrics/categories/top` | `operation_type`, `limit`, `business_type`, optional `start_date`, `end_date` | `TopCategoriesResponse` (`CategoryEntry[]`) | Request the top income categories separately for B2B and B2C. |
| `GET /api/metrics/summary` | `group_by=month`, `operation_type=income`, `business_type`, optional `start_date`, `end_date` | `MetricsSummaryResponse` (`MetricsSummaryEntry[]`) | Calculate each business line's group income total for percentages and the chart. |

`operation_type` accepts `income` or `outcome` and defaults to `outcome`; this view must explicitly send `income`. `limit` is an integer from `1` through `20`, inclusive, and defaults to `5`; this view sends `5`. `business_type` accepts `B2B` or `B2C` and is optional in the API, but each category request must send the relevant group. The date fields are optional, valid `YYYY-MM-DD` dates, and inclusive. `group_by` accepts `day`, `week`, or `month` and defaults to `month`; this view explicitly sends `month`.

Each top-category response entry has `category: Category`, `operation_type: OperationType`, and `total_amount: number`. The endpoint returns an array, not a wrapper, and may return fewer than five entries. It does not return the business group's total income or category percentages. For each group, sum the `income` values from its summary response. Calculate a row percentage as `total_amount / groupTotalIncome * 100`.

**Facet mismatch resolved:** the PM brief says categories must come from facets for each group, but the verified facets response has one shared `categories` array and no B2B/B2C category partitions. Treat `FacetsResponse.categories` as the shared category vocabulary; use each group's top-category response to determine its actual income categories. Do not invent per-business facet fields.

**Edge cases the UI must show**

- Fewer than five categories: display the returned rows only; do not pad the table.
- Empty top-category response: show `No income categories for this group and date range.` in that group's section.
- Zero group total: display `N/A` for percentages and `0` for the chart total.
- Both group totals zero: keep the chart region visible and show an explicit no-income state.
- One request fails: identify the failed group or data source and provide retry; do not present partial data as a complete comparison.