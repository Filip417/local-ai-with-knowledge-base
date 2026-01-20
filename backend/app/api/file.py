from fastapi import APIRouter, HTTPException, UploadFile, Query, File
from fastapi.responses import StreamingResponse
from app.models.file import File as FileModel
from app.repositories import get_file_repository
from app.services.file_service import handle_file_stream


router = APIRouter()


@router.post("/file")
async def upload_source_text_file(file: UploadFile = File(...)):
    """
    Saves file to backend/sources directory,
    reads their content, and stores it in ChromaDB with file ID tracking.
    """
    # Ensure we have a filename
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Missing file or filename.")

    print(f"content type: {file.content_type}")
    # Validate file type extension
    supported_formats = ["txt", "md", "pdf", "docx"]
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in supported_formats:
        raise HTTPException(status_code=400,
            detail=f"Only {supported_formats} text files formats are accepted.")
    
    new_file = FileModel(
        name=file.filename,
        path='None',
        extension=file_extension,
        size_bytes=0,
        content_type=file.content_type
    )

    try:
        repo = get_file_repository()
        repo.create(new_file, upload_file=file, file_extension=file_extension)
        return {
            "message": f"File '{new_file.name}' uploaded successfully.",
            "type": new_file.content_type,
            "file_id": str(new_file.id)
        }
    except:
        raise HTTPException(status_code=400, detail=f"File '{file.filename}' not uploaded successfully.")


@router.get("/files")
async def get_all_files():
    """
    Get all tracked files and their vector DB status.
    """
    repo = get_file_repository()
    files = repo.get_all()
    return {
        "files": [
            {
                "id": str(f.id),
                "name": f.name,
                "path": f.path,
                "extension": f.extension,
                "size_bytes": f.size_bytes,
                "content_type" : f.content_type,
            }
            for f in files
        ]
    }


@router.get("/file-content")
async def get_file_content(filename: str = Query(...)):
    """
    Get the content of a specific file by filename.
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    
    repo = get_file_repository()
    file = repo.get_by_name(filename)
    if not file:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    
    return StreamingResponse(
        handle_file_stream(file),
        media_type="text/plain",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.delete("/files")
async def clear_file_collection_in_vector_db():
    """
    Wipes the current collection and prepares it for fresh data.
    """
    try:
        repo = get_file_repository()
        repo.delete_all()
        return {"message": "Vector collection cleared successfully."}
    except:
        raise HTTPException(status_code=500, detail=f"Failed to clear collection")


@router.delete("/file")
async def delete_file_from_sources_folder_and_vector_db(filename: str = Query(...)):
    """
    Deletes a file from both the backend/sourcesfolder and the vector database
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    
    repo = get_file_repository()
    file = repo.get_by_name(filename)
    if not file:
        return {
            "message": f"File '{filename}' not found in repository.",
            "file_id": str(-1)
        }
    
    try:
        repo.delete(file)
        return {
            "message": f"File '{filename}' deleted successfully.",
            "file_id": str(file.id)
        }
    except:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")