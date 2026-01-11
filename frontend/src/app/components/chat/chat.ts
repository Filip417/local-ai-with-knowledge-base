import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  response = signal('');

  constructor(private chatService: ChatService) {}

  sendPrompt(msg: string): void {
    this.chatService.sendMessage(msg).subscribe({
      next: (res) => {
        this.response.set(res.answer);
      },
      error: (error) => {
        console.error('Error:', error);
        this.response.set('Something went wrong. Please try again.');
      }
    });   
  }
}
