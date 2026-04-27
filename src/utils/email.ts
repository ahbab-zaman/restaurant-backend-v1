import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { getVerificationOtpEmailTemplate } from "../shared/email/email-templates.js";
import { authRepository } from "../modules/auth/auth.repository.js";

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465, // true for 465, false for other ports
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: env.email.from,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendOTPEmail = async (email: string, otp: string) => {
  const user = await authRepository.findUserByEmail(email);
  const { html } = getVerificationOtpEmailTemplate(
    { name: user?.name, email },
    otp,
  );

  return await sendEmail(email, "Verification Code - Course Marketplace", html);
};
