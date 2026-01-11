export enum Role {
  User = 'user',
  Assistant = 'assistant'
}

export interface Message {
  role: Role;
  text: string;
  timestamp: string; // ISO string
}
