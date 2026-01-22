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

  relativeTime(timestamp: string): string {
    if (!timestamp) return '';
    let ts = timestamp;
    ts = ts.replace(/(\.\d{3})\d+/, '$1');
    let date = new Date(ts);
    if (isNaN(date.getTime())) {
      date = new Date(ts.replace(/\.\d+/, ''));
    }
    if (isNaN(date.getTime())) return timestamp;

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} d ago`;
  }

  async deleteSelectedSession(item_id: string) {
    try {
      const deleted = await this.chatService.deleteSession(item_id);
      if (deleted && this.chatService.getCurrentSessionId() === item_id) {
        this.chatService.setCurrentSessionId(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
    await this.loadSessions();
  }

}
