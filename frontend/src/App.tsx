import { lazy, Suspense, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type FinancialMovement,
  type KPIMetrics,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import {
  computeKPIs,
  computeMonthlyData,
  getDashboardPeriod,
} from "@/lib/financial-utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const IncomeOutcomeChart = lazy(() =>
  import("@/components/dashboard/income-outcome-chart").then(
    ({ IncomeOutcomeChart }) => ({ default: IncomeOutcomeChart }),
  ),
);
const ProfitPercentChart = lazy(() =>
  import("@/components/dashboard/profit-percent-chart").then(
    ({ ProfitPercentChart }) => ({ default: ProfitPercentChart }),
  ),
);

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

function ChartLoadingFallback() {
  return (
    <Card aria-hidden="true" className="border-border/60">
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="mt-1 h-3 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [period, setPeriod] = useState("Loading period...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData()
      .then((movements) => {
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
        setPeriod(getDashboardPeriod(movements));
      })
      .catch(() => {
        setPeriod("Unavailable");
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="dark min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardHeader period={period} />

          <main
            id="main-content"
            tabIndex={-1}
            className="mt-8 flex flex-col gap-8"
          >
            {error ? (
              <div
                lang="es"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
              >
                {error}
              </div>
            ) : null}

            <section aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="sr-only">
                Key performance indicators
              </h2>
              <KPIRow metrics={metrics} loading={loading} />
            </section>

            <section
              aria-labelledby="charts-heading"
              className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            >
              <h2 id="charts-heading" className="sr-only">
                Financial charts
              </h2>
              <Suspense fallback={<ChartLoadingFallback />}>
                <IncomeOutcomeChart data={monthlyData} loading={loading} />
              </Suspense>
              <Suspense fallback={<ChartLoadingFallback />}>
                <ProfitPercentChart data={monthlyData} loading={loading} />
              </Suspense>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
