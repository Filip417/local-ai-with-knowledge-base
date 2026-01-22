import { Injectable } from "@angular/core";

// services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE = 'http://localhost:8000/api/v1';
  
  readonly endpoints = {
    chat: `${this.BASE}/chat`,
    file: `${this.BASE}/file`,
    files: `${this.BASE}/files`,
    fileContent: `${this.BASE}/file-content`,
    messages: `${this.BASE}/messages`,
    sessions: `${this.BASE}/sessions`,
    settings: `${this.BASE}/settings`,
    prompt: `${this.BASE}/settings/prompt`
  };
}