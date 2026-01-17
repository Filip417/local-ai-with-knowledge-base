from typing import Optional, List, Dict
from fastapi import UploadFile
from uuid import UUID
from app.models.file import File
from app.services.file_service import (clear_documents_collection,
                                        upload_file_to_vector_db,
                                        save_or_reuse_data_file,
                                        delete_file_from_disk,
                                        delete_file_from_vector_db)
class FileRepository:
    """
    In-memory repository for managing File metadata.
    Tracks which files have been uploaded and are in the vector database.
    """

    def __init__(self):
        self._files: Dict[UUID, File] = {}  # Store by ID
        self._file_path_index: Dict[str, UUID] = {}  # Map file_path to ID for quick lookup

    def create(self, file: File, upload_file : UploadFile, file_extension : str) -> File:
        """Add a new file to the repository."""
        if file.id in self._files:
            raise ValueError(f"File with ID {file.id} already exists.")

        file.size_bytes = upload_file.size if upload_file.size is not None else 0
        saved_path = save_or_reuse_data_file(upload_file)
        
        if saved_path:
            file.path = saved_path
            upload_file_to_vector_db(saved_path, file_extension=file_extension, file_id=file.id)
        
        self._files[file.id] = file
        self._file_path_index[file.path] = file.id
        return file

    def get_by_id(self, file_id: UUID) -> Optional[File]:
        """Retrieve a file by its ID."""
        return self._files.get(file_id)

    def get_by_path(self, file_path: str) -> Optional[File]:
        """Retrieve a file by its path."""
        file_id = self._file_path_index.get(file_path)
        if file_id:
            return self._files.get(file_id)
        return None

    def get_by_name(self, file_name: str) -> List[File]:
        """Retrieve all files matching a filename."""
        return [f for f in self._files.values() if f.name == file_name]

    def get_all(self) -> List[File]:
        """Retrieve all files."""
        return list(self._files.values())

    def update(self, file_id: UUID, **kwargs) -> Optional[File]:
        """Update file metadata."""
        file = self._files.get(file_id)
        if not file:
            return None
        
        # Create updated file with new values
        updated_file = file.model_copy(update=kwargs)
        self._files[file_id] = updated_file
        
        return updated_file

    def delete(self, file : File) -> bool:
        """Delete a file from the repository."""
        delete_file_from_vector_db(file.id)
        delete_file_from_disk(file.name)
        del self._files[file.id]
        self._file_path_index.pop(file.path, None)
        return True

    def delete_all(self) -> None:
        """Clear all files from the repository."""
        clear_documents_collection()
        self._files.clear()
        self._file_path_index.clear()

    def exists(self, file_id: UUID) -> bool:
        """Check if a file exists by ID."""
        return file_id in self._files

    def exists_by_path(self, file_path: str) -> bool:
        """Check if a file exists by path."""
        return file_path in self._file_path_index


# Global instance for singleton pattern
_file_repository: Optional[FileRepository] = None


def get_file_repository() -> FileRepository:
    """Get or create the singleton FileRepository instance."""
    global _file_repository
    if _file_repository is None:
        _file_repository = FileRepository()
    return _file_repository
