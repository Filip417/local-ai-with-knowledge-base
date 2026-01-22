import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Chat } from './components/chat/chat';
import { Sources } from './components/sources/sources';
import { History } from './components/history/history';
import { SettingsModal } from './components/settings-modal/settings-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Chat, Sources, History, SettingsModal],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  @ViewChild(Chat) chatComponent?: Chat;
  @ViewChild(History) historyComponent?: History;

  isSettingsOpen = false;

  onSessionSelected(sessionId: string): void {
    this.chatComponent?.loadSession(sessionId);
  }

  onChatCleared(clear: boolean): void {
    this.historyComponent?.loadSessions();
  }

  openSettings(): void {
    this.isSettingsOpen = true;
  }

  closeSettings(): void {
    this.isSettingsOpen = false;
  }
}