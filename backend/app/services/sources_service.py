from typing import List
import uuid
import os
import shutil
from app.database import chroma_client
from app.core.config import VECTOR_DB_COLLECTION_NAME
from ..models.message import Message, Role
from fastapi import UploadFile

# Init functions
def clear_documents_collection():
    """
    Deletes and recreates the collection to clear all data.
    """
    try:
        chroma_client.delete_collection(name=VECTOR_DB_COLLECTION_NAME)
    except Exception:
        return False
    
    return True


def add_documents(documents: List[str]):
    """
    Adds text chunks to the vector database.
    """
    if not documents:
        return
        
    doc_ids = [str(uuid.uuid4()) for _ in documents]
    collection = chroma_client.get_or_create_collection(name=VECTOR_DB_COLLECTION_NAME)
    collection.add(
        ids=doc_ids,
        documents=documents,
    )
    return doc_ids


def get_results_from_vector_db(query_texts: List[Message], results_to_return : int = 2):
    """
    returns results from chroma db query
    """
    formatted_query_texts = []

    for m in reversed(query_texts):
        # Optionally to limit amount of messages to only last x in reverse order
        # Optionally to also include assistant messages
        if m.role == Role.user:
            formatted_query_texts.append(m.text)

    collection = chroma_client.get_or_create_collection(name=VECTOR_DB_COLLECTION_NAME)
    results = collection.query(
    query_texts=formatted_query_texts, # chroma will embed this
    n_results=results_to_return # how many results to return
    )
    print(results) # tmp for DEBUG
    return results


def save_or_reuse_data_file(file: UploadFile):
    """Save upload into backend/data (reusing existing file name) and return the path."""
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    os.makedirs(data_dir, exist_ok=True)
    raw_name = file.filename or ""
    if not raw_name:
        return None

    filename = os.path.basename(raw_name)
    destination = os.path.join(data_dir, filename)

    if os.path.exists(destination):
        return destination

    try:
        file.file.seek(0)
        with open(destination, "wb") as dest:
            shutil.copyfileobj(file.file, dest)
        return destination
    except Exception:
        return None


def upload_file_to_vector_db(file_path: str, file_extension: str):
    """Load a saved file from disk and push its contents into the vector DB."""
    if file_extension.lower() == "txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
            add_documents([text_content])
            return True
        except Exception as e:
            print(e)
            return False
    return False


def delete_file_from_disk(filename: str):
    """Delete a file from the backend/data directory."""
    try:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
        file_path = os.path.join(data_dir, os.path.basename(filename))
        
        if os.path.exists(file_path):
            os.remove(file_path)
        return True
    except Exception as e:
        print(f"Error deleting file from disk: {e}")
        return False


def delete_file_from_vector_db(filename: str):
    """Delete documents associated with a file from the vector database."""
    try:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
        file_path = os.path.join(data_dir, os.path.basename(filename))
        
        # Read the file content to identify documents to delete
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
            
            collection = chroma_client.get_or_create_collection(name=VECTOR_DB_COLLECTION_NAME)
            # Query to find documents matching this file's content
            results = collection.query(query_texts=[text_content], n_results=1)
            
            # Delete the matching documents
            if results and results.get("ids") and len(results["ids"]) > 0:
                collection.delete(ids=results["ids"][0])

        return True
    except Exception as e:
        print(f"Error deleting file from vector db: {e}")
        return False