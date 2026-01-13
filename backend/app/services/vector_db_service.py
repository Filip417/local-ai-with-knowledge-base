from typing import List
import uuid
import os
from app.database import chroma_client, collection
from app.core.config import VECTOR_DB_COLLECTION_NAME
from ..models.message import Message, Role


# Init functions
def clear_documents_collection(collection_name: str = VECTOR_DB_COLLECTION_NAME):
    """
    Deletes and recreates the collection to clear all data.
    """
    try:
        chroma_client.delete_collection(name=collection_name)
    except Exception:
        pass # Collection might not exist yet
    
    return chroma_client.get_or_create_collection(name=collection_name)


def add_documents(documents: List[str]):
    """
    Adds text chunks to the vector database.
    """
    if not documents:
        return
        
    doc_ids = [str(uuid.uuid4()) for _ in documents]
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

    results = collection.query(
    query_texts=formatted_query_texts, # chroma will embed this
    n_results=results_to_return # how many results to return
    )
    print(results) # tmp for DEBUG
    return results



# --- Usage local testing ---
def load_random_documents(directory_path):
    # 1. Get a list of all files in the directory
    all_files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
    
    documents = []
    
    # 2. Read the content of each selected file
    for file_name in all_files:
        file_path = os.path.join(directory_path, file_name)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                documents.append(f.read())
        except Exception as e:
            print(f"Could not read {file_name}: {e}")
            
    return documents

# --- Usage local testing ---
# folder_path = r"C:\Users\sawin\coding-projects\local-ai-with-knowledge-base\local-ai-with-knowledge-base\backend\data"
# random_docs = load_random_documents(folder_path)
# add_documents(random_docs)