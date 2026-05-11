import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";

export const SMTP_HOST = defineSecret("SMTP_HOST");
export const SMTP_PORT = defineSecret("SMTP_PORT");
export const SMTP_USER = defineSecret("SMTP_USER");
export const SMTP_PASS = defineSecret("SMTP_PASS");
export const SMTP_FROM = defineSecret("SMTP_FROM");

export const MAILER_SECRETS = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM];

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: Number(SMTP_PORT.value() || "587"),
    secure: false,
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value(),
    },
  });
  return _transporter;
}

export type MailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
};

export async function sendMail(input: MailInput): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: SMTP_FROM.value() || "개미청소 <noreply@ant-cleaning.app>",
      to: Array.isArray(input.to) ? input.to.join(",") : input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });
  } catch (err) {
    logger.error("sendMail failed", { to: input.to, err });
    throw err;
  }
}
