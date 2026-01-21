export enum Role {
  User = 'user',
  Assistant = 'assistant'
}

export interface Message {
  session_id: string | null;
  text: string;
  role: Role;
  timestamp: string; // ISO string
}
