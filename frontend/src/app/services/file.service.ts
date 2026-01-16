import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileContentResponse {
  file_name: string;
  content: string;
  file_size_bytes: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:8000/api/v1/file-content';

  constructor(private http: HttpClient) { }

  getFileContent(filename: string): Observable<FileContentResponse> {
    return this.http.get<FileContentResponse>(this.apiUrl, {
      params: { filename }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
