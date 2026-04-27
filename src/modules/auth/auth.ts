import { betterAuth } from "better-auth";
import { sendEmail } from "../../shared/email/email-service.js";
import {
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
} from "../../shared/email/email-templates.js";
import { prisma } from "../../database/prisma.js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "../../config/env.js";
import { compareValue, hashValue } from "../../utils/hash.js";

export async function initAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    baseURL: env.betterAuthUrl,
    secret: env.betterAuthSecret,
    trustedOrigins: [env.appUrl],
    user: {
      fields: {
        emailVerified: "isEmailVerified",
        image: "avatar",
      },
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "STUDENT",
          required: true,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        const { html, text } = getPasswordResetEmailTemplate(user, url);
        await sendEmail({
          to: user.email,
          subject: "Reset Your Password",
          text,
          html,
        });
      },
      password: {
        hash: async (password) => hashValue(password),
        verify: async ({ hash, password }) =>
          compareValue(password, hash),
      },
      autoSignIn: false,
    },
    socialProviders: {
      google: {
        accessType: "offline",
        prompt: "select_account consent",
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const { html, text } = getVerificationEmailTemplate(user, url);
        await sendEmail({
          to: user.email,
          subject: "Verify Your Email Address",
          text,
          html,
        });
      },
      sendOnSignUp: false,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    },
    rateLimit: {
      window: 10,
      max: 100,
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        // Automatically link accounts if the email is verified
        autoLinkWithEmail: true,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieName: "better-auth.session_token",
    },
    advanced: {
      useSecureCookies: env.isProduction,
    },
  });
}

export let auth: any = undefined;

export async function setupAuth() {
  auth = await initAuth();
  return auth;
}
