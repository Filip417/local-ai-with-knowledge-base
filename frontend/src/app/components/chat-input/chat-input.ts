import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-input.html',
  styleUrls: ['./chat-input.css'],
})
export class ChatInput {
  @Output() send = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  sendPrompt(msg: string): void {
    const text = (msg || '').trim();
    if (!text) return;
    this.send.emit(text);
  }

  onEnter(event: KeyboardEvent, input: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const val = input.value;
      input.value = '';
      this.sendPrompt(val);
    }
  }

  clearChatHistory() {
    this.clear.emit();
  }
}
