from uuid import UUID, uuid4
from typing import Optional
from pydantic import BaseModel, Field
from app.core.enums import Role


class Message(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    session_id: str | None = None
    text: str
    role: Role
    timestamp: str # ISO string
