from pydantic import BaseModel
from uuid import UUID
from app.core.enums import Role


class Message(BaseModel):
    id: UUID
    text: str
    role: Role
    timestamp: str # ISO string
