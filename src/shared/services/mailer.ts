import nodemailer from 'nodemailer';
import { config } from '../../config/env';

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
};

const hasSmtpConfig =
  Boolean(config.smtpHost) &&
  Boolean(config.smtpPort) &&
  Boolean(config.smtpUser) &&
  Boolean(config.smtpPass) &&
  Boolean(config.mailFrom);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  : null;

export async function sendMail(payload: MailPayload) {
  if (!transporter || !config.mailFrom) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM.');
  }

  await transporter.sendMail({
    from: config.mailFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });
}
