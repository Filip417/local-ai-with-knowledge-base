import chromadb
from app.core.config import VECTOR_DB_COLLECTION_NAME


def initialize_chroma_client():
    """
    Initialize and return a ChromaDB client with the required collection.
    """
    client = chromadb.Client()
    client.create_collection(name=VECTOR_DB_COLLECTION_NAME)
    return client


# Global ChromaDB client instance
chroma_client = chromadb.Client()