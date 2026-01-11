from fastapi import APIRouter, HTTPException
from ..models.message import ChatRequest
from ..services.chat_service import handle_query

router = APIRouter()

@router.post("/", response_model=dict)
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/v1/chat/ expects { "messages": [ ... ] }
    """
    messages = request.messages
    result = await handle_query(messages)
    if not result:
        raise HTTPException(status_code=500, detail="processing failed")
    return result