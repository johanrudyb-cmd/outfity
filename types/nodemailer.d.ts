declare module 'nodemailer' {
  export interface SendMailOptions {
    [key: string]: unknown;
  }

  export interface Transporter {
    sendMail: (options: SendMailOptions) => Promise<unknown>;
  }

  export function createTransport(options: Record<string, unknown>): Transporter;
}
