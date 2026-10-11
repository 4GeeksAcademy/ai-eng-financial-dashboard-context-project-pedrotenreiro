# Project Conventions

## Architecture

1. Keep browser API requests relative to `/api` unless an explicit `VITE_API_BASE_URL` override is required.
   - Evidence: `frontend/src/App.tsx` requests `/api/metrics`, and `frontend/vite.config.ts` proxies `/api` to `http://backend:8000`.

2. Keep reusable dashboard calculations in `frontend/src/lib/financial-utils.ts`; dashboard components should consume their results rather than reimplement totals or monthly grouping.
   - Evidence: `frontend/src/App.tsx` calls `computeKPIs` and `computeMonthlyData` from that module.

3. When changing the financial-movement API contract, update the FastAPI model and the frontend TypeScript type together, and add tests on both sides.
   - Evidence: `backend/app/routes.py` defines `FinancialMovement`; `frontend/src/lib/financial-types.ts` mirrors its fields and allowed values.

4. Keep the dashboard period label derived from the returned data or an explicit API filter; do not hardcode a year.
   - Evidence: `frontend/src/App.tsx` passes `2024 - Full Year`, while `backend/app/routes.py` selects generated movement years from `date.today()`.

## Backend

5. Define endpoint inputs and outputs with FastAPI `Query` constraints and Pydantic response models.
   - Evidence: `backend/app/routes.py` uses `Query` parameters and `response_model` declarations for metrics endpoints.

6. Use a local random generator for generated fixture data rather than calling `random.seed` on the module-global generator.
   - Evidence: `backend/app/routes.py` calls `random.seed(seed)` in `generate_mock_movements`, and every metrics endpoint invokes it with `seed=42`.

7. Restrict CORS origins before deploying beyond local development.
   - Evidence: `backend/app/main.py` currently sets `allow_origins=["*"]` and `allow_credentials=True`.

## Frontend

8. Treat backend `YYYY-MM-DD` values as date-only values when grouping or formatting; avoid local-time parsing that can shift a record across a month boundary.
   - Evidence: `frontend/src/lib/financial-utils.ts` currently passes `m.create_date` to `new Date()` and then uses `getFullYear()` and `getMonth()`.

## Testing

9. Add backend behavior tests with Pytest and FastAPI `TestClient` for every new route or filter combination.
   - Evidence: `backend/tests/test_routes.py` tests `/health`, metrics filters, B2B/B2C routes, facets, summaries, categories, comparisons, and alerts using `TestClient`.

10. Add Vitest coverage for frontend utility changes and add an `App`-level test when changing the request, loading, error, or rendered dashboard behavior.
    - Evidence: `frontend/src/lib/financial-utils.test.ts` tests only utility functions; `frontend/src/App.tsx` owns the fetch, loading, and error states.

## Developer Experience

11. Use the Compose stack as the default local runtime command.
    - Evidence: `README.md` documents `docker compose up --build`, and `docker-compose.yml` defines the `frontend` and `backend` services and their ports.
