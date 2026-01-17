import { Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ChatMessages } from '../chat-messages/chat-messages';
import { ChatInput } from '../chat-input/chat-input';
import { Message, Role } from '../../models/message';
import { ChatService } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { SourcesService } from '../../services/sources.service';

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
  isSending = signal(false);
  @ViewChild('chatContainer') chatContainer?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      this.messages(); // track changes
      setTimeout(() => this.scrollChatContainerToBottom(), 0);
    });
  }

  private addMessage(message: Message) {
    this.messages.update(arr => [...arr, message]);
  }

  async sendPrompt(msg: string) {
    const text = msg.trim();
    if (this.isSending() || !text) return;

    this.isSending.set(true);
    this.addMessage({ role: Role.User, text, timestamp: new Date().toISOString() });
    
    const messagesToSend = this.messages();
    
    const assistantMsg: Message = { 
      role: Role.Assistant, 
      text: '', 
      timestamp: new Date().toISOString() 
    };
    this.addMessage(assistantMsg);

    try {
      const selectedIds = this.sourcesService.getSelectedFileIds();
      const requestBody = {
        messages: messagesToSend,
        selected_file_ids: selectedIds.length > 0 ? selectedIds : undefined
      };

      await this.chatService.sendChatStream(requestBody, (chunk: string) => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], text: updated[lastIndex].text + chunk };
          return updated;
        });
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Stream failed", err);
        // Update the assistant message with error feedback
        this.messages.update(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            text: `There has been an error connecting to the LLM model 
            - verify if backend endpoint is working: ${this.apiService.endpoints.chat}` 
          };
          return updated;
        });
      }
    } finally {
      this.isSending.set(false);
    }
  }

  clearChatHistory(): void {
    this.chatService.abortCurrentRequest();
    this.messages.set([]);
  }

  private scrollChatContainerToBottom() {
    this.chatContainer?.nativeElement.scrollTo({
        top: this.chatContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
    });
  }
}
