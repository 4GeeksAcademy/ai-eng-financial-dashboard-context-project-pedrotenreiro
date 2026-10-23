# Component Specifications

## 1. Home Dashboard Date Range

### `DashboardDateRangeFilter`

**Purpose:** Let users apply one inclusive date range to every date-sensitive value shown on the home dashboard.

**Inputs and behavior:**

- Fetch `FacetsResponse` from `GET /api/metrics/facets` once when the dashboard loads. Use `min_date` and `max_date` as the valid input bounds and show both dates next to the inputs as `Available: {min_date} to {max_date}`.
- Render two native date inputs labelled `Start date` and `End date`. Each accepts a date in `YYYY-MM-DD` form and may be blank.
- Keep the selected values as `DateRangeFilter`. Omit an unset value from query strings; do not send empty strings or `null`.
- The bounds are inclusive. Equal start and end dates are valid. Prevent submission when start is later than end and show an inline message: `Start date must be on or before end date.`
- Both dates must fall between `FacetsResponse.min_date` and `FacetsResponse.max_date`, inclusive. An unset side remains unbounded.
- Apply the same selected range to the dashboard metrics request and its dependent chart and alert data. Changing either date reloads all date-sensitive data together; facets remain unfiltered.

**Visible states:**

- While facets load, keep the controls unavailable and show a loading state.
- If facets fail, show an error with a retry action; do not imply that a date range is available.
- If the selected range has no records, retain the dashboard layout and show the existing no-data state for its metrics and charts.

**Types:** `FacetsResponse`, `DateRangeFilter`, `MetricsResponse`.

## 2. Home Dashboard Anomaly Alerts

### `AnomalyAlerts`

**Purpose:** Show monthly outcome spikes below the home dashboard charts.

**Inputs and behavior:**

- Props: `rows: AnomalyRow[]`, `threshold: number`, `onThresholdChange: (threshold: number) => void`, `dateRange: DateRangeFilter`, and `loading: boolean`.
- Render a numeric threshold input labelled `Spike threshold`. Its ratio value must be from `0.01` through `1.0`, inclusive; default it to `0.3`. A value of `0.3` means a 30% increase. Reject values outside this UI range and do not silently clamp them.
- Build monthly values from `GET /api/metrics/summary` with `group_by=month`, `operation_type=outcome`, and the selected date bounds. If a start date is selected, request enough prior data to include the three calendar months before the first displayed month; do not display those baseline-only months. If start date is unset, use the earliest available period.
- For each displayed month, calculate `rolling_average` from the immediately preceding three calendar-month outcome totals. Fill missing months inside the available dataset date range with zero. Do not evaluate a candidate until three preceding periods are available. Skip a candidate when its rolling average is zero because a relative increase is undefined.
- Calculate `increase_ratio = (outcome_total - rolling_average) / rolling_average`. Include a row only when `increase_ratio > threshold`; equality is not an anomaly. Show the ratio as a percentage (`increase_ratio * 100`) in the table.
- Show columns in this order: `Period`, `Recorded outcome`, `Previous 3-period average`, and `Increase`. Format period as `YYYY-MM` and monetary values using the dashboard's existing monetary formatter without inventing a currency symbol.
- The backend `GET /api/metrics/alerts` response is not a source for this table: its `baseline_average` is the mean of all earlier periods, not the requested rolling average of the previous three. Do not relabel `baseline_average` as a rolling average.

**Visible states:**

- While data loads, show a table loading state.
- When no rows meet the threshold, keep the table area visible and show `No spending anomalies found for this date range and threshold.`
- If the selected period has fewer than three prior periods, omit those untestable months. If no months can be tested, show `Not enough history to evaluate anomalies.`
- On request failure, show an error state with a retry action; do not show the empty state as if the request succeeded.

**Types:** `AnomalyRow`, `MetricsSummaryParams`, `MetricsSummaryResponse`, `DateRangeFilter`. `AlertsParams` and `AlertResponse` describe the existing raw alerts endpoint only; that endpoint does not meet the rolling-average requirement.

## 3. B2B vs B2C Comparison

### `BusinessComparisonPage`

**Purpose:** Compare income categories and total income for B2B and B2C over one selected date range.

**Inputs and behavior:**

- Fetch `FacetsResponse` from `GET /api/metrics/facets`. Use `min_date` and `max_date` for the same optional, inclusive date inputs defined by `DashboardDateRangeFilter`.
- Render two category sections side by side: B2B and B2C. For each section, request `GET /api/metrics/categories/top` with `operation_type=income`, `limit=5`, that section's `business_type`, and the selected date bounds.
- Display each returned category as a table row with `Category`, `Total income`, and `Percentage of group total`. The endpoint returns at most five entries, sorted by `total_amount` descending; show fewer than five when fewer categories have income and do not fabricate rows.
- The categories in `FacetsResponse.categories` are the shared category universe. Facets does not return separate category arrays for B2B and B2C. Use the top-categories response to determine which categories actually appear for each group.
- For each business line, request `GET /api/metrics/summary` with `group_by=month`, `operation_type=income`, its `business_type`, and the same date bounds. Sum the response `income` values to get that business line's total income denominator. The category endpoint response does not include a group total or percentage.
- Calculate each percentage as `category.total_amount / groupTotalIncome * 100`. Use the same date bounds for the category and summary requests.
- Below both tables, render one comparison chart with exactly two group totals, B2B and B2C, in the selected date range. Label the values and use the dashboard's existing monetary formatter.

**Visible states:**

- Loading and request errors must be visible without removing the two group sections or the chart region.
- If one group's top-categories response is empty, show `No income categories for this group and date range.` in that section.
- If a group's total income is zero, show `N/A` for category percentages and a zero total in the chart; do not divide by zero.
- If both groups have no income, keep the chart region and show an explicit no-income state instead of rendering an empty plot.

**Types:** `FacetsResponse`, `TopCategoriesParams`, `TopCategoriesResponse`, `MetricsSummaryParams`, `MetricsSummaryResponse`, and `DateRangeFilter`.