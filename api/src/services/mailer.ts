import { Resend } from "resend";

export interface Mailer {
  sendCode(to: string, code: string): Promise<void>;
}

/** Thrown when a message could not be sent. Carries no address, code or provider message. */
export class MailError extends Error {
  constructor() {
    super("mail_failed");
    this.name = "MailError";
  }
}

// TODO: Spanish and Arabic lines need native review.
function codeEmail(code: string): { subject: string; text: string } {
  return {
    subject: "Your FamilyForward code / Su código / رمزك",
    text: [
      `Your FamilyForward code is ${code}. It expires in 10 minutes. If you did not ask for it, you can ignore this email.`,
      "",
      `Su código de FamilyForward es ${code}. Vence en 10 minutos. Si no lo pidió, puede ignorar este correo.`,
      "",
      `رمز FamilyForward الخاص بك هو ${code}. تنتهي صلاحيته خلال 10 دقائق. إذا لم تطلبه فيمكنك تجاهل هذه الرسالة.`,
    ].join("\n"),
  };
}

export class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async sendCode(to: string, code: string): Promise<void> {
    const { subject, text } = codeEmail(code);
    try {
      const { error } = await this.client.emails.send({ from: this.from, to, subject, text });
      if (error) {
        throw new MailError();
      }
    } catch {
      throw new MailError();
    }
  }
}

/**
 * Development only: prints the code to the terminal so the flow can be tried without a mail key.
 * createMailer never returns this outside NODE_ENV=development.
 */
export class ConsoleMailer implements Mailer {
  async sendCode(to: string, code: string): Promise<void> {
    process.stdout.write(`[dev only] sign-in code for ${to}: ${code}\n`);
  }
}

export function createMailer(env: {
  NODE_ENV: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
}): Mailer {
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  }
  if (env.NODE_ENV === "development") {
    return new ConsoleMailer();
  }
  throw new Error("No mail provider configured");
}
