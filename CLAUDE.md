# Kubosun Console — Instructions for Claude Code

AI-native Kubernetes console built with Next.js (frontend) + Python FastAPI (backend).

## Project structure

```
kubosun-console/
├── frontend/              # Next.js 15 (App Router, TypeScript strict, PatternFly 6)
│   ├── src/app/           #   File-based routes
│   ├── src/components/    #   React components
│   ├── src/hooks/         #   Custom React hooks
│   ├── src/lib/           #   Utilities and K8s client
│   └── src/config/        #   YAML config (navigation, models)
├── backend/               # Python FastAPI
│   ├── app/main.py        #   FastAPI app entry
│   ├── app/config.py      #   Pydantic settings
│   ├── app/routers/       #   API route modules
│   └── tests/             #   pytest tests
├── docker-compose.yml     # Local development
└── ROADMAP.md             # Project milestones
```

## Common commands

```bash
# Frontend
cd frontend && npm install          # Install deps
cd frontend && npm run dev          # Dev server (localhost:3000)
cd frontend && npm run build        # Production build
cd frontend && npm run lint         # ESLint
cd frontend && npm run type-check   # TypeScript check
cd frontend && npm test             # Vitest tests

# Backend
cd backend && pip install -e ".[dev]"   # Install deps
cd backend && uvicorn app.main:app --reload  # Dev server (localhost:8000)
cd backend && pytest                    # Run tests
cd backend && ruff check .              # Lint
cd backend && ruff format .             # Format

# Docker
docker compose up --build           # Start both services
docker compose watch                # Start with hot reload
```

## Coding conventions

### Frontend (TypeScript)
- **File-based routing**: Creating `src/app/foo/page.tsx` creates the `/foo` route
- **One component per file**: Name file same as component (PascalCase)
- **Hooks in `src/hooks/`**: Prefix with `use` (e.g., `useK8sResource.ts`)
- **No barrel imports**: Import from specific file paths, never from `index.ts`
- **PatternFly first**: Use PatternFly components before writing custom ones
- **Tests co-located**: `Component.test.tsx` next to `Component.tsx`
- **Strict TypeScript**: All code must pass `tsc --noEmit` with strict mode

### Backend (Python)
- **Routers in `app/routers/`**: One file per domain (e.g., `health.py`, `k8s.py`, `ai.py`)
- **Pydantic models**: Use for all request/response schemas
- **Async everywhere**: All route handlers and K8s calls should be async
- **Type hints**: All function signatures must have type hints
- **Tests in `tests/`**: Mirror the `app/` structure (e.g., `tests/test_health.py`)

### General
- No console.log / print statements in committed code
- No hardcoded URLs — use config/environment variables
- No unused imports or variables
- Commit messages: imperative mood, concise subject line

## Adding a new resource page

1. Create directory: `frontend/src/app/(console)/resources/{plural-name}/`
2. Create `page.tsx` (list view), `[name]/page.tsx` (details view)
3. Create `columns.ts` (table column definitions)
4. Create `actions.ts` (resource actions)
5. Add nav entry to `frontend/src/config/navigation.yaml`
6. Run `npm test -- --related` to verify

## Adding a new backend endpoint

1. Create router file: `backend/app/routers/{domain}.py`
2. Register in `backend/app/main.py`: `app.include_router(router)`
3. Add test: `backend/tests/test_{domain}.py`
4. Run `pytest` to verify

## Key hooks (frontend)

- `useK8sResource(model, name, namespace)` — single resource with real-time updates
- `useK8sResourceList(model, namespace)` — list with SSE watch
- `useAccessReview({ verb, resource, namespace })` — RBAC permission check
- `useAIAgent()` — AI chat interface

## Do NOT

- Import from barrel/index files (causes circular deps and slow builds)
- Create new shared components without checking PatternFly first
- Skip TypeScript types or use `any`
- Hardcode K8s API URLs (use models and the proxy)
- Add features beyond what was asked for
- Write custom CSS when PatternFly has a component for it
