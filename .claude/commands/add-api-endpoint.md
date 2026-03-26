# Add a Backend API Endpoint

Create a new FastAPI router with endpoints, register it, add a test, and configure the frontend proxy rewrite.

## Instructions

1. Ask the user for:
   - **Domain name** (e.g., `alerts`, `metrics`, `helm`)
   - **Route prefix** (e.g., `/api/alerts`)
   - **Endpoints** (e.g., GET /list, POST /create)

2. Create `backend/app/routers/{domain}.py`:
   - Import `APIRouter` from `fastapi`
   - Create `router = APIRouter(prefix="/api/{prefix}", tags=["{domain}"])`
   - Add async route handlers with type hints
   - Use Pydantic `BaseModel` for request/response schemas
   - Accept `Request` if you need `request.state.user_token` for K8s calls

3. Read `backend/app/main.py` and register the new router:
   - Add import: `from app.routers import {domain}`
   - Add: `app.include_router({domain}.router)`

4. Create `backend/tests/test_{domain}.py` with basic tests using `TestClient`.

5. Read `frontend/next.config.ts` and add a rewrite rule:
   ```
   { source: '/api/{prefix}/:path*', destination: `${backendUrl}/api/{prefix}/:path*` }
   ```

6. Run `cd backend && ruff check . && pytest` to verify.

7. Commit with message: `Add /api/{prefix} endpoint for {domain}`

## Key files
- `backend/app/routers/` — existing router examples
- `backend/app/main.py` — router registration
- `backend/app/config.py` — settings (Pydantic)
- `frontend/next.config.ts` — proxy rewrites

## Conventions
- All handlers are `async`
- All functions have type hints
- Use `request.state.user_token` for per-user K8s operations
- Pydantic models for all request/response schemas
- No hardcoded URLs — use `app.config.settings`
