import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Chat } from './components/chat/chat';
import { AppHeader } from './components/app-header/app-header';
import { Sources } from './components/sources/sources';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Chat, Sources, AppHeader],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  selectedFileIds = signal<string[]>([]);

  onSelectionChanged(ids: string[]) {
    this.selectedFileIds.set(ids);
  }
}