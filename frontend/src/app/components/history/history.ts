import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { ChatService } from '../../services/chat.service';

type HistoryItem = {
  id: string;
  title: string;
  timestamp: string;
  lastMessage: string;
};

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History implements OnInit {
  private chatService = inject(ChatService);
  
  isCollapsed = signal(false);
  historyItems = signal<HistoryItem[]>([]);
  isLoading = signal(false);
  
  sessionSelected = output<string>();

  async ngOnInit() {
    await this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.isLoading.set(true);
    try {
      const sessions = await this.chatService.getSessions();
      this.historyItems.set(sessions.map(session => ({
        id: session.id,
        title: session.title,
        timestamp: session.timestamp,
        lastMessage: session.lastMessage
      })));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.historyItems.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onItemClick(sessionId: string): void {
    this.sessionSelected.emit(sessionId);
  }

  toggleCollapsed(): void {
    this.isCollapsed.update(value => !value);
  }

  panelWidth(): string {
    return this.isCollapsed() ? '50px' : '20vw';
  }
}
