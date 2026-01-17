from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chat_service import handle_query_stream
from uuid import UUID
from app.models.chat_request import ChatRequest


router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/v1/chat/ expects { "messages": [...], "selected_file_ids": [...] }
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Convert string UUIDs to UUID objects if provided
    selected_file_ids = None
    if request.selected_file_ids:
        try:
            selected_file_ids = [UUID(fid) for fid in request.selected_file_ids]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")

    # StreamingResponse keeps HTTP connection open while chunks are sent.
    return StreamingResponse(
        handle_query_stream(request.messages, selected_file_ids),
        media_type="text/plain",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )