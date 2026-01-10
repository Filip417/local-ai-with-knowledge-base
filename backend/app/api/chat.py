from fastapi import APIRouter, HTTPException
from ..models.query import Query  # relative import within package
from ..services.chat_service import handle_query

router = APIRouter()

@router.post("/", response_model=dict)
async def chat_endpoint(q: Query):
    """
    Minimal example — delegate to service layer for real logic.
    POST /api/v1/chat/
    """
    result = await handle_query(q)
    if not result:
        raise HTTPException(500, "processing failed")
    return result