import type {
  BusinessType,
  Category,
  GroupBy,
  OperationType,
} from "./api-types";

/** Optional inclusive date bounds shared by metrics requests. */
export interface DateRangeFilter {
  /** Optional inclusive lower bound, formatted YYYY-MM-DD; omit when unset. */
  start_date?: string;
  /** Optional inclusive upper bound, formatted YYYY-MM-DD; omit when unset. */
  end_date?: string;
}

/** Query parameters accepted by GET /api/metrics/alerts. */
export interface AlertsParams extends DateRangeFilter {
  /** Minimum relative increase ratio; API minimum is 0 and default is 0.3, while the dashboard control allows 0.01 through 1.0. */
  threshold?: number;
  /** Period grouping: day, week, or month; API default is month. */
  group_by?: GroupBy;
  /** Optional business-line filter: B2B or B2C. */
  business_type?: BusinessType;
}

/** Query parameters used to request top categories for one business line. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation type; the comparison view always sends income. */
  operation_type?: OperationType;
  /** Number of highest-total categories requested; integer from 1 through 20, API default is 5. */
  limit?: number;
  /** Business line requested by the comparison section: B2B or B2C. */
  business_type?: BusinessType;
}

/** Query parameters for monthly income totals used by the anomaly and comparison views. */
export interface MetricsSummaryParams extends DateRangeFilter {
  /** Grouping requested by this UI: month; API also accepts day and week. */
  group_by?: GroupBy;
  /** Optional operation filter; comparison denominators request income. */
  operation_type?: OperationType;
  /** Optional category filter accepted by the endpoint. */
  category?: Category;
  /** Optional business-line filter used to calculate separate B2B and B2C totals. */
  business_type?: BusinessType;
}