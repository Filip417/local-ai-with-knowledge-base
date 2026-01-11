import { Component, effect, ElementRef, OnChanges, signal, SimpleChanges, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatHeader } from './components/chat-header/chat-header';
import { ChatMessages } from './components/chat-messages/chat-messages';
import { ChatInput } from './components/chat-input/chat-input';
import { ChatService } from './services/chat.service';

type Message = { role: 'user' | 'assistant'; text: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatHeader, ChatMessages, ChatInput],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  messages = signal<Message[]>([]);

  constructor(private chatService: ChatService) {
    effect(() => {
      this.messages(); // track changes
      Promise.resolve().then(() => this.scrollChatContainerToBottom());
    });
  }

  sendPrompt(msg: string): void {
    const text = (msg || '').trim();
    if (!text) return;

    // add user message
    this.messages.update(arr => [...arr, { role: 'user', text }]);

    // send to backend
    this.chatService.sendMessage(text).subscribe({
      next: (res: any) => {
        const answer = res?.answer ?? '';
        this.messages.update(arr => [...arr, { role: 'assistant', text: answer }]);
      },
      error: () => {
        this.messages.update(arr => [...arr, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
      }
    });
  }

  @ViewChild('chatContainer') chatContainer?: ElementRef<HTMLElement>;
  private scrollChatContainerToBottom() {
    this.chatContainer?.nativeElement.scrollTo({ top: this.chatContainer.nativeElement.scrollHeight });
  }

}