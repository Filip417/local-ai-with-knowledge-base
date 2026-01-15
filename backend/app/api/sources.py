from fastapi import APIRouter, HTTPException, UploadFile, File
# Import your functions from the service file
from ..services.sources_service import (clear_documents_collection,
                                        upload_file_to_vector_db,
                                        save_or_reuse_data_file)

router = APIRouter()

@router.post("/upload-source")
async def upload_source_text_file(file: UploadFile = File(...)):
    """
    Accepts only .txt files, saves them to backend/data,
    reads their content, and stores it in ChromaDB.

    TODO develop support for:
    """
    # Ensure we have a filename
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Missing file or filename.")

    # Validate file type extension
    supported_formats = ["txt"]
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in supported_formats:
        raise HTTPException(status_code=400,
            detail=f"Only {supported_formats} text files formats are accepted.")
    
    saved_path = save_or_reuse_data_file(file)
    if not saved_path:
        raise HTTPException(status_code=400, detail=f"File '{file.filename}' not uploaded successfully.")

    if upload_file_to_vector_db(saved_path, file_extension):
        return {
        "message": f"File '{file.filename}' uploaded successfully.",
        "type": file.content_type,
    }
    else:
        raise HTTPException(status_code=400, detail=f"File '{file.filename}' not uploaded successfully.")


@router.post("/clear-sources-collection")
async def clear_file_collection_in_vector_db():
    """
    Wipes the current collection and prepares it for fresh data.
    """
    if clear_documents_collection():
            return {"message": "Vector collection cleared successfully."}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to clear collection")