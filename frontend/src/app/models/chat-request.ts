import { Message } from './message';

export interface ChatRequest {
  messages: Message[];
  selected_file_ids?: string[];
}
