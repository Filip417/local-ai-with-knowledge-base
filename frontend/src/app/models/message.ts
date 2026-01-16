export enum Role {
  User = 'user',
  Assistant = 'assistant'
}

export interface Message {
  id: string;
  text: string;
  role: Role;
  timestamp: string; // ISO string
}
