from enum import Enum
from pydantic import BaseModel
from typing import List

class Role(str, Enum):
    user = "user"
    assistant = "assistant"


class Message(BaseModel):
    text: str
    role: Role
    timestamp: str # ISO string

class ChatRequest(BaseModel):
    messages: List[Message]