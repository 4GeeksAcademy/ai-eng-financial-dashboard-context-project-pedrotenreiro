---
name: dashboard-pre-merge
description: Review and verify changes to this Vite and FastAPI financial dashboard before merge.
---

# Class: Dashboard Pre-Merge Review

## Objective

Check that a dashboard change preserves financial data correctness, accessibility, and the repository's build and test baseline. Keep findings tied to changed files and avoid unrelated cleanup.

## Inputs

- Changed file list or proposed behavior
- Expected UI behavior and any API contract changes
- Whether Docker Compose, the backend, and a browser are available

## Expected Output

- Findings or accepted changes with file paths and the project rule or skill behind each
- Exact build, test, and lint commands run, with pass/fail results
- Remaining checks that could not be verified in the current environment

## Acceptance Criteria

1. Read the applicable files in `.agents/rules/` and the relevant project memory before editing.
2. Keep financial calculations in `frontend/src/lib/financial-utils.ts`. Treat API dates as `YYYY-MM-DD` date-only values; do not introduce local-time shifts.
3. When changing the movement API contract, update the FastAPI model, frontend type, and relevant route tests together. Use relative `/api` requests unless an explicit `VITE_API_BASE_URL` override is required.
4. For frontend changes, run the repository build, test, and lint scripts. In this dev-container, prefer:
   - `docker compose run --build --rm --no-deps frontend npm run build`
   - `docker compose run --rm --no-deps frontend env VITE_API_BASE_URL= npm test`
   - `docker compose run --rm --no-deps frontend npm run lint`
5. Clear `VITE_API_BASE_URL` for tests that expect `/api/metrics`; `frontend/.env` may set a forwarded URL and override Vite's default. If `npm ci` reports that `package-lock.json` is out of sync, report the dependency drift instead of silently rewriting the lockfile as part of an unrelated UI change.
6. Preserve keyboard access and semantics: use a skip link to `#main-content`, ordered headings, named sections, announced errors, visible focus, and `accessibilityLayer` on Recharts charts. Hide adjacent decorative icons from assistive technology. Check text and focus contrast against the active theme; use a browser audit when browser tooling is available.
7. Preserve chart dimensions while lazy-loaded modules are pending. Treat a Vite chunk-size warning as a prompt to assess code splitting; do not hide it by raising the warning limit without evidence.
8. This is a Vite app, not Next.js. Put the single-page title and description in `frontend/index.html`; do not introduce Next-only image, font, or metadata APIs.
9. If a browser is unavailable, label keyboard and live accessibility checks as unverified; do not present build output or static inspection as a browser audit.
10. Run `git diff --check` for authored source changes and leave unrelated warnings or dependency work out of the change.
