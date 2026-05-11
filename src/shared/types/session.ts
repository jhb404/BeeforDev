export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'reconnecting'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'error';

export interface Credentials {
  email: string;
  password: string;
}
