export const SMS_SENDER_PORT = Symbol('SMS_SENDER_PORT');

export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
}

export interface SmsSenderPort {
  send(options: SendSmsOptions): Promise<void>;
}
