export enum Role {
  User = 'user',
  Assistant = 'assistant'
}

export interface Message {
  text: string;
  role: Role;
  timestamp: string; // ISO string
}
