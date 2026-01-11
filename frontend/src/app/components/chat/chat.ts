import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

type Message = { role: 'user' | 'assistant'; text: string };

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class Chat {
  messages = signal<Message[]>([]);
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  constructor(private chatService: ChatService) {}

  sendPrompt(msg: string): void {
    const text = (msg || '').trim();
    if (!text) return;

    // add user message
    this.messages.update(arr => [...arr, { role: 'user', text }]);
    this.scrollToBottom();

    // send to backend
    this.chatService.sendMessage(text).subscribe({
      next: (res) => {
        const answer = res?.answer ?? '';
        this.messages.update(arr => [...arr, { role: 'assistant', text: answer }]);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update(arr => [...arr, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
        this.scrollToBottom();
      }
    });
  }

  onEnter(event: KeyboardEvent, input: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const val = input.value;
      input.value = '';
      this.sendPrompt(val);
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        const el = this.messagesContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      } catch {}
    }, 50);
  }
}

