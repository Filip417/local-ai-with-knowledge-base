export interface FileModel {
  id: string;
  file_name: string;
  file_path: string;
  file_extension: string;
  file_size_bytes: number;
  is_in_vector_db: boolean;
}
