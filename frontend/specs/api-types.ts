/** Operation values accepted and returned by the metrics API. */
export type OperationType = "income" | "outcome";

/** Business-line values accepted and returned by the metrics API. */
export type BusinessType = "B2B" | "B2C";

/** Category values accepted and returned by the metrics API. */
export type Category =
  | "suppliers"
  | "sales"
  | "operational"
  | "administrative"
  | "others";

/** Period granularities accepted by summary and alerts endpoints. */
export type GroupBy = "day" | "week" | "month";

/** Available metric filters and inclusive date bounds returned by /api/metrics/facets. */
export interface FacetsResponse {
  /** Operation values present in the dataset: income or outcome. */
  operation_types: OperationType[];
  /** Business lines present in the dataset: B2B or B2C. */
  business_types: BusinessType[];
  /** Shared category values present in the dataset; not partitioned by business line. */
  categories: Category[];
  /** Earliest dataset date, formatted YYYY-MM-DD. */
  min_date: string;
  /** Latest dataset date, formatted YYYY-MM-DD. */
  max_date: string;
}

/** One financial movement returned by /api/metrics; amount uses the dataset's monetary unit. */
export interface FinancialMovementEntry {
  /** Movement date, formatted YYYY-MM-DD. */
  create_date: string;
  /** Numeric movement amount in the dataset's monetary unit; OpenAPI declares no range constraint. */
  amount: number;
  /** Whether the movement is income or outcome. */
  operation_type: OperationType;
  /** Category assigned to the movement. */
  category: Category;
  /** Business line assigned to the movement. */
  business_type: BusinessType;
}

/** Array response returned by GET /api/metrics. */
export type MetricsResponse = FinancialMovementEntry[];

/** One grouped total returned by /api/metrics/summary. */
export interface MetricsSummaryEntry {
  /** Group label: YYYY-MM-DD for day, YYYY-Www for week, or YYYY-MM for month. */
  period: string;
  /** Total income for this period in the dataset's monetary unit. */
  income: number;
  /** Total outcome for this period in the dataset's monetary unit. */
  outcome: number;
  /** Income minus outcome for this period in the dataset's monetary unit. */
  net: number;
}

/** Array response returned by GET /api/metrics/summary. */
export type MetricsSummaryResponse = MetricsSummaryEntry[];

/** One raw anomaly returned by GET /api/metrics/alerts. */
export interface AlertEntry {
  /** Group label, formatted according to the requested group_by value. */
  period: string;
  /** Outcome total for the period in the dataset's monetary unit. */
  outcome_total: number;
  /** Mean outcome across all earlier returned periods, not a rolling three-period mean. */
  baseline_average: number;
  /** Relative increase over baseline as a ratio; 0.3 represents 30 percent. */
  increase_ratio: number;
}

/** Array response returned by GET /api/metrics/alerts; the endpoint has no response wrapper. */
export type AlertResponse = AlertEntry[];

/** One row derived for the requested rolling-three-period anomaly table. */
export interface AnomalyRow {
  /** Calendar month label formatted YYYY-MM. */
  period: string;
  /** Outcome total for this month in the dataset's monetary unit. */
  outcome_total: number;
  /** Mean outcome of the three immediately preceding calendar months. */
  rolling_average: number;
  /** Relative increase over rolling_average as a ratio; 0.3 represents 30 percent. */
  increase_ratio: number;
}

/** One category total returned by /api/metrics/categories/top. */
export interface CategoryEntry {
  /** Category name; values are a subset of the shared facets categories. */
  category: Category;
  /** Operation used to calculate this total; the comparison view requests income. */
  operation_type: OperationType;
  /** Category total in the dataset's monetary unit. */
  total_amount: number;
}

/** Array response returned by GET /api/metrics/categories/top; the endpoint has no response wrapper. */
export type TopCategoriesResponse = CategoryEntry[];