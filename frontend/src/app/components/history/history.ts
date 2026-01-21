import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type HistoryItem = {
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
export class History {
  isCollapsed = signal(false);
  historyItems = signal<HistoryItem[]>([
    {
      title: 'Release notes draft',
      timestamp: '2025-01-05 11:44',
      lastMessage: 'Summarized backend API changes and default model path.'
    },
    {
      title: 'Bug triage',
      timestamp: '2025-01-08 16:02',
      lastMessage: 'Narrowed an upload failure to the embedding step.'
    },
    {
      title: 'Dataset Q&A',
      timestamp: '2025-01-10 09:18',
      lastMessage: 'Discussed context window sizing for longer chunks.'
    }
  ]);

  toggleCollapsed(): void {
    this.isCollapsed.update(value => !value);
  }

  panelWidth(): string {
    return this.isCollapsed() ? '50px' : '20vw';
  }
}
