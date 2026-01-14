import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Chat } from './components/chat/chat';
import { AppHeader } from './components/app-header/app-header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Chat, AppHeader],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
}