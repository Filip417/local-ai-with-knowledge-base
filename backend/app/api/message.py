from fastapi import APIRouter, Query, HTTPException
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
                "id": session.get("id"),
                "title": session.get("title"),
                "timestamp": session.get("timestamp"),
                "lastMessage": session.get("lastMessage"),
            }
            for session in sessions
        ]
    }

@router.delete("/sessions")
async def delete_session(session_id: str = Query(...)):
    repo = get_message_repository()
    
    try:
        repo.delete_by_session(session_id=session_id)
        return {
            "message": f"Messages for session id '{session_id}' deleted successfully.",
            "file_id": session_id
        }
    except:
        raise HTTPException(status_code=404, detail=f"Messages with session id '{session_id}' not found.")