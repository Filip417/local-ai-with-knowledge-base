import { Component, effect, ElementRef, OnChanges, signal, SimpleChanges, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { ChatHeader } from './components/chat-header/chat-header';
import { ChatMessages } from './components/chat-messages/chat-messages';
import { ChatInput } from './components/chat-input/chat-input';
import { Message, Role } from './models/message';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatHeader, ChatMessages, ChatInput],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
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

  async sendPrompt(msg: string) {
    const text = msg.trim();
    if (this.isSending() || !text) return;

    // 2. Initialize a new controller for this request
    this.abortController = new AbortController();
    this.isSending.set(true);

    this.addMessage({ role: Role.User, text, timestamp: new Date().toISOString() });
    const assistantMsg: Message = { role: Role.Assistant, text: '', timestamp: new Date().toISOString() };
    this.addMessage(assistantMsg);

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.messages() }),
        // 3. Pass the signal to the fetch call
        signal: this.abortController.signal 
      });

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
      // 4. Handle the specific "Abort" error
      if (err.name === 'AbortError') {
        console.log('Fetch aborted: Connection closed by user.');
      } else {
        console.error("Stream failed", err);
      }
    } finally {
      this.isSending.set(false);
      this.abortController = null; // Reset controller
    }
  }

clearChatHistory(): void {
    // 5. Abort the ongoing request if it exists
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