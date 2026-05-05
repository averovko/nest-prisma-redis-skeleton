export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailSenderPort {
  send(options: SendEmailOptions): Promise<void>;
}
