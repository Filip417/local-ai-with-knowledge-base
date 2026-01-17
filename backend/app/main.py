from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.file import router as file_router
import uvicorn
import chromadb
from app.core.config import VECTOR_DB_COLLECTION_NAME


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

chroma_client = chromadb.Client()
chroma_client.create_collection(name=VECTOR_DB_COLLECTION_NAME)

uvicorn.run(app, host="0.0.0.0", port=8000)