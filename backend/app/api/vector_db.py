from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
# Import your functions from the service file
from ..services.vector_db_service import add_documents, clear_documents_collection

router = APIRouter()

@router.post("/upload-file")
async def upload_file_to_vector_db(file: UploadFile = File(...)):
    """
    Uploads a file, reads its content, and stores it in ChromaDB.
    """
    try:
        # Read the file content
        content = await file.read()
        text_content = content.decode("utf-8")
        
        # For now, we treat the whole file as one document - not splitted into chunks
        add_documents([text_content])
        
        return {
            "message": f"File '{file.filename}' uploaded and indexed successfully.",
            "type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.post("/clear-file-collection")
async def clear_file_collection_in_vector_db():
    """
    Wipes the current collection and prepares it for fresh data.
    """
    try:
        clear_documents_collection()
        return {"message": "Vector collection cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear collection: {str(e)}")