from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class File(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    path: str
    extension: str
    size_bytes: int
    content_type: str | None