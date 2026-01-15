from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.chat import router as chat_router
from .api.sources import router as vector_db_router
from contextlib import asynccontextmanager

# Optional startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # start up events
    yield
    # shutdown events
    pass

app = FastAPI(lifespan=lifespan)

# CORS allow Angular (localhost:4200) to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])
app.include_router(vector_db_router, prefix="/api/v1", tags=["vector_db"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)