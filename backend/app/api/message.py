from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.services.chat_service import handle_query_stream
from uuid import UUID
from app.models.chat_request import ChatRequest
from app.repositories import get_message_repository

router = APIRouter()


@router.get("/messages")
async def get_messages(session_id: str = Query(...)):
    repo = get_message_repository()
    messages = repo.get_by_session(session_id=session_id)

    return {
        "messages": [
            {
                "id": message.id,
                "session_id": message.session_id,
                "text": message.text,
                "role": message.role,
                "timestamp": message.timestamp,
            }
            for message in messages
        ]
    }


@router.get("/sessions")
async def get_sessions():
    """
    Get history of sessions.
    """
    repo = get_message_repository()
    sessions = repo.get_sessions_data()
    return {
        "sessions": [
            {
                "id": "",
                "title": "",
                "timestamp": "",
                "lastMessage": "",
            }
            for session in sessions
        ]
    }