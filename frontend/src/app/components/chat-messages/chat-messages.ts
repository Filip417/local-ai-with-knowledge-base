import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  templateUrl: './chat-messages.html',
  styleUrls: ['./chat-messages.css'],
})
export class ChatMessages {
  @Input() messages: Message[] = [];
}