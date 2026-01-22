export enum Role {
  User = 'user',
  Assistant = 'assistant'
}

export interface Message {
  id: string | null;
  session_id: string;
  text: string;
  role: Role;
  timestamp: string; // ISO string
}
