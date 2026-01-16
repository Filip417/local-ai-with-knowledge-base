from fastapi import APIRouter, HTTPException, UploadFile, Query, File
from fastapi.responses import StreamingResponse
from app.models.file import File as FileModel
from app.repositories import get_file_repository


router = APIRouter()

@router.post("/file")
async def upload_source_text_file(file: UploadFile = File(...)):
    """
    Accepts only .txt files, saves them to backend/data,
    reads their content, and stores it in ChromaDB with file ID tracking.
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
    
    new_file = FileModel(
        file_name=file.filename,
        file_path='tbc',
        file_extension=file_extension,
        file_size_bytes=0
    )

    try:
        repo = get_file_repository()
        repo.create(new_file, upload_file=file, file_extension=file_extension)
        return {
            "message": f"File '{file.filename}' uploaded successfully.",
            "type": file.content_type,
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
                "file_name": f.file_name,
                "file_path": f.file_path,
                "file_extension": f.file_extension,
                "file_size_bytes": f.file_size_bytes,
                "is_in_vector_db": f.is_in_vector_db
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
    files = repo.get_by_name(filename)
    if not files:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
    
    file_record = files[0]
    
    if (file_record.file_extension == 'txt'):
        try:
            def iterfile():
                with open(file_record.file_path, 'r', encoding='utf-8') as f:
                    yield from f
            
            return StreamingResponse(iterfile(), media_type="text/plain")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


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
async def delete_file_from_data_folder_and_vector_db(filename: str = Query(...)):
    """
    Deletes a file from both the backend/data folder and the vector database
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    
    repo = get_file_repository()
    files = repo.get_by_name(filename)
    if not files:
        return {
            "message": f"File '{filename}' not found in repository.",
            "file_id": str(-1)
        }
    
    file_record = files[0]

    try:
        repo.delete(file_record)
        return {
            "message": f"File '{filename}' deleted successfully.",
            "file_id": str(file_record.id)
        }
    except:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")