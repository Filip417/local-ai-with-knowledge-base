from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chat_service import handle_query_stream
from uuid import UUID
from app.models.chat_request import ChatRequest
from app.repositories import get_message_repository
from app.models.message import Message
from app.core.enums import Role
from datetime import datetime

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

    repo = get_message_repository()
    repo.create_from_chat_request(chat_request=request)

    async def stream_and_record():
        assistant_chunks = []
        try:
            async for chunk in handle_query_stream(request.messages, selected_file_ids):
                assistant_chunks.append(chunk)
                yield chunk
        finally:
            assistant_text = "".join(assistant_chunks)
            if assistant_text:
                assistant_message = Message(
                    session_id=request.session_id,
                    text=assistant_text,
                    role=Role.assistant,
                    timestamp=datetime.now().isoformat()
                )
                try:
                    repo.create(assistant_message)
                except Exception:
                    # Don't raise from cleanup; streaming already finished for client.
                    pass
    # StreamingResponse keeps HTTP connection open while chunks are sent.
    return StreamingResponse(
        stream_and_record(),
        media_type="text/plain",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )