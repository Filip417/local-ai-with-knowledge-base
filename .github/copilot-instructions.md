## What this repo is
- Privacy-first local RAG app: Angular frontend + FastAPI backend using ChromaDB and a local Llama model (llama-cpp). Users upload text files, they are embedded/stored in Chroma, and chat queries stream completions enriched with retrieved context.
- Languages/frameworks: Angular 21 (TypeScript) in `frontend/`; FastAPI + llama-cpp in `backend/`. Target runtime: Node 20+ (npm 10.9.3 per package.json) and Python 3.10+ (recommend 3.11).
- Repo shape: root files `README.md`, `LICENSE`, `.github/`; app code in `backend/app/...` and `frontend/src/...`; model file in `backend/app/llmmodels/Llama-3.2-3B-Instruct-Q5_K_M.gguf` (large, required by llama-cpp path in config).

## Layout highlights
- Backend entry: `backend/app/main.py` (FastAPI app, CORS for http://localhost:4200, routers mounted under `/api/v1`).
- API: `backend/app/api/chat.py` (POST `/api/v1/chat`, streams text/plain), `backend/app/api/file.py` (upload txt, list, fetch, delete, clear collection).
- Core config: `backend/app/core/config.py` (VECTOR_DB_COLLECTION_NAME, CONTEXT_LIMIT, MAX_OUTPUT_TOKENS, MODEL_ABSOLUTE_PATH absolute Windows path); adjust MODEL_ABSOLUTE_PATH if running elsewhere. Vector setup: `backend/app/core/database.py` initializes Chroma client/collection.
- Services: `backend/app/services/chat_service.py` (wraps llama-cpp, streams chunks, pulls context from vector DB), `backend/app/services/file_service.py` (file ingest to `backend/sources/`, embeddings into Chroma).
- Frontend: standalone Angular components in `frontend/src/app/...`; services hit `/api/v1/chat`, `/api/v1/file`, `/api/v1/files`, `/api/v1/file-content`. Global styles `frontend/src/styles.css`. Angular configs `angular.json`, `tsconfig*.json`.
- Tests: Angular uses Vitest via `ng test`. No backend tests present. No GitHub Actions workflows currently in `.github/workflows`.

## Known dependencies/pitfalls
- `llama_cpp` is required but not listed in `requirements.txt`; install manually. The bundled model path is absolute to the repo; adjust when cloning elsewhere or use an env var override in `config.py`.
- Large model file may be absent in fresh clones; without it, chat endpoints will raise on startup. Use a compatible GGUF model and update the path.
- CORS is limited to `http://localhost:4200`; if you change frontend origin, update middleware in `main.py`.
- No CI workflows; local checks (serve/build/test) are the only validation.

## Quick file map
- Root: README.md (run instructions), LICENSE, backend/, frontend/, .github/ (this guide).
- Backend subdirs: `api/` (chat, file), `services/` (chat_service, file_service), `models/` (pydantic schemas), `repositories/` (file repo), `sources/` (uploaded text), `llmmodels/` (GGUF).
- Frontend key files: `src/app/services/*.ts` (API calls), `src/app/components/*` (chat UI, file upload), `src/app/models/*` (Message, File), `src/styles.css` (layout), `angular.json` (build config).

## Working style for Copilot agents
- Trust these instructions first; search the tree only if something here is incomplete or proves wrong.
- Prefer running the listed commands in the stated order. If a command fails, check for missing venv activation, missing llama-cpp install, or an incorrect model path before deeper debugging.
- Keep changes minimal and scoped; there is no CI to auto-catch regressions, so run frontend build/tests when touching UI code and manually exercise backend endpoints when changing API or model logic.