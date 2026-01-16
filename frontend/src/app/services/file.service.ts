import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:8000/api/v1/file-content';

  constructor(private http: HttpClient) { }

  getFileContent(filename: string): Observable<string> {
    return this.http.get(this.apiUrl, {
      params: { filename },
      responseType: 'text'
    });
  }
}
