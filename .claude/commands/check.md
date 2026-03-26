# Run All Checks

Run lint, type-check, and tests for both frontend and backend. Report a summary of pass/fail.

## Instructions

Run these checks in parallel:

**Backend:**
```bash
cd ~/openshift/kubosun-console/backend && source .venv/bin/activate && ruff check . && ruff format --check . && pytest -q
```

**Frontend:**
```bash
cd ~/openshift/kubosun-console/frontend && npm run type-check && npm run lint && npm test
```

Report results as a table:

| Check | Status |
|-------|--------|
| Backend lint (ruff) | Pass/Fail |
| Backend format | Pass/Fail |
| Backend tests (pytest) | Pass/Fail |
| Frontend types (tsc) | Pass/Fail |
| Frontend lint (eslint) | Pass/Fail |
| Frontend tests (vitest) | Pass/Fail |

If any check fails, show the error output and suggest a fix.
