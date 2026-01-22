from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.file import router as file_router
from app.api.message import router as message_router
from app.api.settings import router as settings_router
import uvicorn
from app.core.database import initialize_chroma_client


app = FastAPI()

# CORS allow Angular (localhost:4200) to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])
app.include_router(file_router, prefix="/api/v1", tags=["file"])
app.include_router(message_router, prefix="/api/v1", tags=["message"])
app.include_router(settings_router, prefix="/api/v1", tags=["settings"])

if __name__ == "__main__":
    # Initialize ChromaDB client and collection
    initialize_chroma_client()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)