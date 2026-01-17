from pydantic import BaseModel
from app.core.enums import Role


class Message(BaseModel):
    text: str
    role: Role
    timestamp: str # ISO string
