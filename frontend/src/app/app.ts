import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Chat } from './components/chat/chat';
import { Sources } from './components/sources/sources';
import { History } from './components/history/history';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Chat, Sources, History],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  @ViewChild(Chat) chatComponent?: Chat;

  onSessionSelected(sessionId: string): void {
    this.chatComponent?.loadSession(sessionId);
  }
}