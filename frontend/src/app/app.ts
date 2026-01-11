import { Component, effect, ElementRef, OnChanges, signal, SimpleChanges, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { ChatHeader } from './components/chat-header/chat-header';
import { ChatMessages } from './components/chat-messages/chat-messages';
import { ChatInput } from './components/chat-input/chat-input';
import { ChatService } from './services/chat.service';
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

  constructor(private chatService: ChatService) {
    effect(() => {
      this.messages(); // track changes
      Promise.resolve().then(() => this.scrollChatContainerToBottom());
    });
  }

  private addMessage(message: Message) {
    this.messages.update(arr => [...arr, message]);
  }

  sendPrompt(msg: string): void {
    const text = (msg || '').trim();
    if (!text) return;

    // add user message
    const userMessage: Message = { role: Role.User, text, timestamp: new Date().toISOString() };
    this.addMessage(userMessage);
    this.isSending.set(true);

    // send to backend (send the full conversation)
    const messagesPayload = this.messages();
    this.chatService.sendMessages(messagesPayload)
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: (res: { answer: string }) => {
          const answer = res?.answer ?? 'Something went wrong. Please try again.';
          const assistantMessage: Message = { role: Role.Assistant, text: answer, timestamp: new Date().toISOString() };
          this.addMessage(assistantMessage);
        },

        error: (err) => {
          const assistantMessage: Message = { role: Role.Assistant, text: 'Something went wrong. Please try again.', timestamp: new Date().toISOString() };
          this.addMessage(assistantMessage);
          console.error('sendMessage error', err);
        }
      });
  }

  @ViewChild('chatContainer') chatContainer?: ElementRef<HTMLElement>;
  private scrollChatContainerToBottom() {
    this.chatContainer?.nativeElement.scrollTo({ top: this.chatContainer.nativeElement.scrollHeight });
  }

}