import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  response = signal('');;
  constructor(private chatService: ChatService) {}

  send(msg: string) {
    this.chatService.sendMessage(msg).subscribe(res => {
      this.response.set(res.answer);
    });
  }
}
