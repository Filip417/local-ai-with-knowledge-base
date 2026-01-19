import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message';
import { MarkdownModule } from 'ngx-markdown';
import { ThinkingIndicator } from '../thinking-indicator/thinking-indicator';

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, MarkdownModule, ThinkingIndicator],
  templateUrl: './chat-messages.html',
  styleUrls: ['./chat-messages.css'],
})
export class ChatMessages {
  @Input() messages: Message[] = [];
  @Input() isSending: boolean = false;
  @Input() isWaitingForFirstResponse: boolean = false;
}