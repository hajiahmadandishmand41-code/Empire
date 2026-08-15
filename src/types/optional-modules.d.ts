declare module 'nodemailer' {
  interface Transporter {
    sendMail(message: {
      from?: string;
      to: string;
      subject: string;
      html: string;
      text?: string;
    }): Promise<unknown>;
  }

  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  export function createTransport(options: TransportOptions): Transporter;
}

declare module 'twilio' {
  interface MessageCreator {
    create(message: {
      from: string;
      to: string;
      body: string;
    }): Promise<unknown>;
  }

  interface TwilioClient {
    messages: MessageCreator;
  }

  type TwilioFactory = (accountSid: string, authToken: string) => TwilioClient;

  const twilio: TwilioFactory;
  export default twilio;
}