import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Message, Role } from '../models/message';

/**
 * ChatService encapsulates all HTTP and streaming logic for chat operations.
 * Handles streaming chat responses from the backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private abortController: AbortController | null = null;
  
  // Signal to track current session messages
  private currentSessionId: string | null = null;

  /**
   * Sends a chat request to the backend and streams the response.
   * @param request - The chat request containing messages and file IDs
   * @param onChunk - Callback function to handle each streamed chunk
   * @throws Error if the HTTP request fails
   */
  async sendChatStream(request: { messages: Message[]; selected_file_ids?: string[] }, onChunk: (chunk: string) => void): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.apiService.endpoints.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Chat request aborted by user.');
      } else {
        throw err;
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Aborts the current streaming chat request.
   */
  abortCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Fetches messages for a specific session from the backend.
   * @param sessionId - The ID of the session to fetch messages for
   * @returns Promise resolving to an array of messages
   */
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    const url = `${this.apiService.endpoints.messages}?session_id=${encodeURIComponent(sessionId)}`;
    const response = await this.http.get<{ messages: any[] }>(url).toPromise();
    return response?.messages.map(msg => ({
      id: msg.id,
      session_id: msg.session_id,
      role: msg.role as Role,
      text: msg.text,
      timestamp: msg.timestamp
    })) || [];
  }

  /**
   * Fetches all session history from the backend.
   * @returns Promise resolving to an array of session data
   */
  async getSessions(): Promise<any[]> {
    const response = await this.http.get<{ sessions: any[] }>(this.apiService.endpoints.sessions).toPromise();
    return response?.sessions || [];
  }

  /**
   * Gets the current session ID.
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Sets the current session ID.
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }
}
