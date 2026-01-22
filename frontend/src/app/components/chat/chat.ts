import { Component, effect, inject, output, signal, ViewChild } from '@angular/core';
import { ChatMessages } from '../chat-messages/chat-messages';
import { ChatInput } from '../chat-input/chat-input';
import { Message, Role } from '../../models/message';
import { ChatService } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { SourcesService } from '../../services/sources.service';
import { History } from '../history/history';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ChatMessages, ChatInput],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat {
  private chatService = inject(ChatService);
  private apiService = inject(ApiService);
  private sourcesService = inject(SourcesService);
  messages = signal<Message[]>([]);
  private currentSessionId = signal<string>(this.generateSessionId());
  isSending = signal(false);
  isWaitingForFirstResponse = signal(false);
  @ViewChild(ChatMessages) chatMessages?: ChatMessages;
  onChatCleared = output<boolean>();

  constructor() {
    effect(() => {
      this.messages(); // track changes
      setTimeout(() => this.scrollChatContainerToBottom('auto'), 0);
    });
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private addMessage(message: Message) {
    this.messages.update(arr => [...arr, message]);
  }

  async sendPrompt(msg: string) {
    const text = msg.trim();
    if (this.isSending() || !text) return;

    this.isSending.set(true);
    this.isWaitingForFirstResponse.set(true);
    this.addMessage({id:crypto.randomUUID(), session_id: this.currentSessionId() , role: Role.User, text, timestamp: new Date().toISOString() });
    
    const messagesToSend = this.messages();
    
    // Defer creating the assistant message until we receive data from the API stream.

    try {
      const selectedIds = this.sourcesService.getSelectedFileIds();
      const requestBody = {
        messages: messagesToSend,
        selected_file_ids: selectedIds.length > 0 ? selectedIds : undefined,
        session_id: this.currentSessionId() // redundant duplication?
      };
      console.log(requestBody);

      await this.chatService.sendChatStream(requestBody, (chunk: string) => {
          this.isWaitingForFirstResponse.set(false);
          this.messages.update(msgs => {
            const updated = [...msgs];
            const lastIndex = updated.length - 1;
            const last = updated[lastIndex];
            if (!last || last.role !== Role.Assistant) {
              // First assistant chunk: create new assistant message
              updated.push({
                id: crypto.randomUUID(),
                session_id: this.currentSessionId(),
                role: Role.Assistant,
                text: chunk,
                timestamp: new Date().toISOString()
              });
            } else {
              // Append subsequent chunks to existing assistant message
              updated[lastIndex] = { ...last, text: last.text + chunk };
            }
            return updated;
          });
        this.scrollChatContainerToBottom();
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Stream failed", err);
        const errorText = `There has been an error connecting to the LLM model - verify if backend endpoint is working: ${this.apiService.endpoints.chat}`;
        // If an assistant message already exists, update it; otherwise append a new one
        this.messages.update(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          const last = updated[lastIndex];
          if (last && last.role === Role.Assistant) {
            updated[lastIndex] = { ...last, text: errorText };
          } else {
            updated.push({
              id: crypto.randomUUID(),
              session_id: this.currentSessionId(),
              role: Role.Assistant,
              text: errorText,
              timestamp: new Date().toISOString()
            });
          }
          return updated;
        });
      }
    } finally {
      this.isSending.set(false);
      this.isWaitingForFirstResponse.set(false);
      this.scrollChatContainerToBottom();
    }
  }

  clearChatHistory(): void {
    this.chatService.abortCurrentRequest();
    this.messages.set([]);
    this.currentSessionId.set(this.generateSessionId());
    this.chatService.setCurrentSessionId(null);
    this.onChatCleared.emit(true);
  }

  async loadSession(sessionId: string): Promise<void> {
    try {
      this.chatService.abortCurrentRequest();
      const messages = await this.chatService.getSessionMessages(sessionId);
      this.messages.set(messages);
      this.currentSessionId.set(sessionId);
      this.chatService.setCurrentSessionId(sessionId);
      setTimeout(() => this.scrollChatContainerToBottom('auto'), 0);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }

  private scrollChatContainerToBottom(behavior: ScrollBehavior = 'smooth') {
    this.chatMessages?.scrollToBottom(behavior);
  }
}
