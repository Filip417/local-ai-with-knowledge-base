import chromadb
from app.core.config import VECTOR_DB_COLLECTION_NAME

chroma_client = chromadb.Client()
collection = chroma_client.create_collection(name=VECTOR_DB_COLLECTION_NAME)