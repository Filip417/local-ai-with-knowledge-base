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

  async sendPrompt(msg: string) {
  const text = msg.trim();
  if (!text) return;
  // Add User Message
  this.addMessage({ role: Role.User, text, timestamp: new Date().toISOString() });
  // Add empty Assistant placeholder
  const assistantMsg: Message = { role: Role.Assistant, text: '', timestamp: new Date().toISOString() };
  this.addMessage(assistantMsg);
  this.isSending.set(true);
  try {
    const response = await fetch('http://localhost:8000/api/v1/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: this.messages() })
    });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // Update the LAST message in the signal array
      this.messages.update(msgs => {
        const updated = [...msgs];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
            ...updated[lastIndex],
            text: updated[lastIndex].text + chunk
        };
        return updated;
      });
    }
  } catch (err) {
    console.error("Stream failed", err);
  } finally {
    this.isSending.set(false);
  }
}

  clearChatHistory(): void {
    // reset messages list (clears UI and any in-memory conversation)
    this.messages.set([]);
  }

  private scrollChatContainerToBottom() {
    this.chatContainer?.nativeElement.scrollTo({
        top: this.chatContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
    });
  }

}