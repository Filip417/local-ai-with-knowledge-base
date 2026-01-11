import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/message';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:8000/api/v1/chat/';

  constructor(private http: HttpClient) {}

  sendMessages(messages: Message[]): Observable<any> {
    // send the full conversation as { messages: Message[] }
    return this.http.post(this.apiUrl, { messages });
  }
} 