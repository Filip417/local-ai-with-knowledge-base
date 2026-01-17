import { Component, effect, ElementRef, Input, signal, ViewChild } from '@angular/core';
import { ChatHeader } from '../chat-header/chat-header';
import { ChatMessages } from '../chat-messages/chat-messages';
import { ChatInput } from '../chat-input/chat-input';
import { Message, Role } from '../../models/message';
import { ChatRequest } from '../../models/chat-request';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ChatHeader, ChatMessages, ChatInput],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat {
  @Input() selectedFileIds: string[] = [];
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

  private abortController: AbortController | null = null;
  private readonly ENDPOINT_URL = 'http://localhost:8000/api/v1/chat';

  async sendPrompt(msg: string) {
    const text = msg.trim();
    if (this.isSending() || !text) return;

    // Initialize a new controller for this request
    this.abortController = new AbortController();
    this.isSending.set(true);

    this.addMessage({ role: Role.User, text, timestamp: new Date().toISOString() });
    
    // Send messages excluding the assistant placeholder
    const messagesToSend = this.messages();
    
    const assistantMsg: Message = { 
      role: Role.Assistant, 
      text: '', 
      timestamp: new Date().toISOString() 
    };
    this.addMessage(assistantMsg);

    try {
      const requestBody: ChatRequest = {
        messages: messagesToSend,
        selected_file_ids: this.selectedFileIds.length > 0 ? this.selectedFileIds : undefined
      };

      const response = await fetch(this.ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
        this.messages.update(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], text: updated[lastIndex].text + chunk };
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted: Connection closed by user.');
      } else {
        console.error("Stream failed", err);
        // Update the assistant message with error feedback
        this.messages.update(msgs => {
          const updated = [...msgs];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            text: `There has been an error connecting to the LLM model 
            - verify if backend endpoint is working: ${this.ENDPOINT_URL}` 
          };
          return updated;
        });
      }
    } finally {
      this.isSending.set(false);
      this.abortController = null; // Reset controller
    }
  }

  clearChatHistory(): void {
    // Abort the ongoing request if it exists
    if (this.abortController) {
      this.abortController.abort();
    }
    this.messages.set([]);
  }

  private scrollChatContainerToBottom() {
    this.chatContainer?.nativeElement.scrollTo({
        top: this.chatContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
    });
  }
}
