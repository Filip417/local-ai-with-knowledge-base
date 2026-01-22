from app.models.message import Message
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

class ChatRequest(BaseModel):
    messages: List[Message]
    selected_file_ids: Optional[List[str]] = None
    session_id: str