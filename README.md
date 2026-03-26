# Kubosun Console

AI-native Kubernetes/OpenShift management console.

- **Frontend**: Next.js 15 (App Router) + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Python FastAPI + kubernetes-client + Anthropic SDK
- **AI**: Claude-powered agent for cluster management via natural language

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.12+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health: http://localhost:3000/api/health

### Option 2: Local development

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

**Frontend (in a separate terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Running tests

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && pytest
```

## Project Structure

See [CLAUDE.md](CLAUDE.md) for detailed conventions and coding guidelines.

See [ROADMAP.md](ROADMAP.md) for project milestones and architecture decisions.

## License

Apache-2.0
