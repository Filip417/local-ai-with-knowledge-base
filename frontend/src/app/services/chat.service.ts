import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Message } from '../models/message';

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
}
