# Current Status

## What Works

- The Compose configuration defines a frontend service on port `5173` and a backend service on port `8000`, with debugpy on `5678`.
- The frontend fetches `/api/metrics` through the Vite proxy, derives the displayed period from the response, and has utility and App-level tests.
- Backend route tests cover health, metrics filters, B2B/B2C data, facets, summaries, top categories, comparisons, and alerts.
- Latest frontend validation after the accessibility and deployment changes: production build passed without Vite warnings, Vitest reported `8 passed`, and ESLint passed. The main JavaScript chunk is 188.49 kB (60.10 kB gzip); the shared chart runtime is 342.29 kB (100.53 kB gzip).

## Known Gaps and Constraints

- The backend generates mock financial movements in memory; no database or persistence service is defined in `docker-compose.yml` or `backend/requirements.txt`.
- `backend/app/main.py` permits all CORS origins with credentials, which is appropriate only for unrestricted development use.
- In this dev container, host `frontend/node_modules` is root-owned and `npm ci` reports that `package-lock.json` is missing entries declared by `package.json`. The frontend Docker image's `npm install` path works for checks without rewriting the lockfile.
- The latest backend test run emitted a Starlette deprecation warning for the FastAPI `TestClient` dependency path.
- No local Chromium or browser-audit tool is available, so keyboard navigation and live Lighthouse/performance audits remain unverified.

## Evidence-Backed Next Priorities

These are maintenance priorities inferred from current implementation and validation; no product roadmap is documented in this repository.

1. Define whether financial movements require persistence before adding a database, because `backend/app/routes.py` currently generates mock data.
2. Set allowed CORS origins before deploying beyond local development, because `backend/app/main.py` uses `allow_origins=["*"]` with credentials.
3. Decide whether deployment needs a production static-serving frontend image; `frontend/Dockerfile` currently starts Vite's development server.
4. Review the backend test-client dependency warning during the next dependency update.
5. Reconcile `frontend/package-lock.json` with `frontend/package.json` in a dedicated dependency change.

## Validation Commands

- Frontend in this dev container: `docker compose run --build --rm --no-deps frontend npm run build`, `docker compose run --rm --no-deps frontend env VITE_API_BASE_URL= npm test`, and `docker compose run --rm --no-deps frontend npm run lint`.
- Backend: `pytest tests/test_routes.py` from `backend/` after installing `backend/requirements.txt`.
- Patch hygiene: `git diff --check` from the repository root. Copied upstream skill documents contain trailing spaces in Markdown examples; authored application source passed its targeted check.

## Skills Applied and Learnings

- Loaded `accessibility` from `addyosmani/web-quality-skills` and applied it to the dashboard: skip link, heading structure, announced error and period, decorative icon semantics, keyboard-enabled Recharts, visible focus, forced-colors focus, and reduced motion. Text, focus, and chart token contrast calculations passed applicable AA thresholds.
- Loaded `vercel-react-best-practices` from `vercel-labs/agent-skills`. This repo is Vite, not Next.js, so the applicable changes were React lazy imports with stable chart skeletons and static page metadata in `frontend/index.html`; Next-only image/font APIs do not apply.
- Searched the ecosystem for `performance` and `testing`; selected and applied `addyosmani/web-quality-skills@performance` because the baseline build had a 584.64 kB JavaScript chunk warning. The warning is resolved by splitting the chart runtime rather than raising Vite's warning limit.
- Authored `.skills/dashboard-pre-merge/SKILL.md` as a reusable review class with objective, inputs, expected output, and acceptance criteria. Loaded it against this branch; its environment and command guidance matched the observed Vite API override, lockfile drift, and Docker-based checks.
- Verified frontend build, tests (8/8), lint, and token contrast calculations. No browser or CrUX/trace audit was possible here; run keyboard and browser audits in an environment with Chromium before claiming live accessibility or Core Web Vitals verification.
