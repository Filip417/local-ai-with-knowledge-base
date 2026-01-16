from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class File(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    file_name: str
    file_path: str
    file_extension: str
    file_size_bytes: int
    is_in_vector_db: bool = False