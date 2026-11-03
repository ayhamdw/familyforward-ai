import type { AppConfig } from "../../app";
import type { Mailer } from "../../services/mailer";

export const TEST_JWT_SECRET = "test-jwt-secret-test-jwt-secret-0123456789";
export const TEST_CODE_SECRET = "test-code-secret-test-code-secret-012345";

/** Captures codes instead of sending email. */
export class FakeMailer implements Mailer {
  sent: { to: string; code: string }[] = [];
  fail = false;

  async sendCode(to: string, code: string): Promise<void> {
    if (this.fail) {
      throw new Error("send failed");
    }
    this.sent.push({ to, code });
  }

  lastCode(): string {
    const last = this.sent[this.sent.length - 1];
    if (!last) {
      throw new Error("no email sent");
    }
    return last.code;
  }
}

export function testAppConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: "test",
    logLevel: "silent",
    jwtSecret: TEST_JWT_SECRET,
    codeHmacSecret: TEST_CODE_SECRET,
    mailer: new FakeMailer(),
    ...overrides,
  };
}
