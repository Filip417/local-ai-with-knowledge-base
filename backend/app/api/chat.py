from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ..services.chat_service import handle_query_stream
from ..models.message import ChatRequest

router = APIRouter()

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/v1/chat/ expects { "messages": [ ... ] }
    """
    messages = request.messages
    
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # StreamingResponse keeps HTTP connection open while chunks are sent.
    return StreamingResponse(
        handle_query_stream(messages),
        media_type="text/plain",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )