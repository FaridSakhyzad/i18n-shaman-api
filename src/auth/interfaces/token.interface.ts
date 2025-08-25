export interface IToken {
  _id: string;
  userId: string;
  token: string;
  type: 'email_verification' | 'password_reset' | 'password_reset_security';
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  metadata?: any;
}

export interface ICreateToken {
  userId: string;
  type: IToken['type'];
  expiresInMinutes: number;
  metadata?: any;
}
