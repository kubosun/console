# Add a Dashboard Card

Add a new card to the cluster overview dashboard.

## Instructions

1. Ask the user for:
   - **Card name** (e.g., "PodHealth", "StorageUsage")
   - **What data to display** (e.g., pod status breakdown, PVC usage)
   - **Data source** (existing hook, new API call, or from cluster summary)

2. Create `frontend/src/components/dashboard/{Name}Card.tsx`:
   - `'use client'` directive
   - Accept typed props for the data it displays
   - Use Tailwind CSS for styling
   - Use Lucide icons
   - Follow the existing card patterns in `frontend/src/components/dashboard/`

3. Read `frontend/src/app/(console)/page.tsx` and add the card to the dashboard layout:
   - Import the new card
   - Add it to the appropriate grid section
   - Pass data from `useClusterSummary()` or a new hook

4. If the card needs new data, create a hook or update the backend:
   - New hook: `frontend/src/hooks/use{DataSource}.ts`
   - Backend data: update `backend/app/routers/cluster.py` to include new fields in `/api/cluster/summary`

5. Run `cd frontend && npm run type-check` to verify.

6. Commit with message: `Add {Name} dashboard card`

## Key files
- `frontend/src/components/dashboard/` — existing cards (ClusterInfoCard, NodeHealthCard, etc.)
- `frontend/src/app/(console)/page.tsx` — dashboard page layout
- `frontend/src/hooks/useClusterSummary.ts` — cluster summary data hook
- `backend/app/routers/cluster.py` — /api/cluster/summary endpoint
