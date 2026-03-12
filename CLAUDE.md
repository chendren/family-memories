# Family Memories

Local-first family memory capture, storage, and semantic search.

## Quick Start
- Server: `cd server && npm run dev` (port 3142)
- Frontend: `cd frontend && npm run dev` (port 5173, proxied to 3142)
- Both: `npm run dev` from root

## Architecture
- TypeScript monorepo: shared/, server/, frontend/
- SQLite (better-sqlite3, WAL) for relational data — data/family-memories.db
- LanceDB (embedded) for vector search — data/vectordb/
- Ollama (localhost:11434): nomic-embed-text (embeddings), cx-intelligence-slm (inference)
- Redis (localhost:6379) for caching
- Express + WebSocket on port 3142
- React 19 + Vite + Tailwind + @xyflow/react

## Code Style
- TypeScript strict mode, ES modules
- No regex — use string methods or LLM parsing
- Functional style, short functions, single responsibility
- nanoid for IDs, pino for logging, date-fns for dates
- Server: routes/ for HTTP, services/ for logic, jobs/ for async
- Frontend: pages/ for routes, components/ for UI, hooks/ for data, stores/ for state

## Key Commands
- `npm run dev` — start both server and frontend
- `npm run build` — build all packages
- `curl localhost:3142/api/health` — check services

## Data Directory
- data/ is gitignored. Contains SQLite DB, LanceDB files, uploaded media.
- Media served at /media/originals/ and /media/thumbnails/
