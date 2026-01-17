import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  getFileContent(filename: string): Observable<string> {
    return this.http.get(this.apiService.endpoints.fileContent, {
      params: { filename },
      responseType: 'text'
    });
  }
}
