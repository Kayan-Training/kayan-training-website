/**
 * Better Auth server instance.
 *
 * Responsibilities:
 * - Connect Better Auth to Prisma-backed persistence.
 * - Enable email/password and optional Google OAuth.
 * - Enable admin role capabilities and Next.js cookie handling.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/mailer";
import {
  emailVerificationTemplate,
  resetPasswordTemplate,
} from "@/lib/email/templates";

const hasGoogleOAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const authSecret = process.env.BETTER_AUTH_SECRET ?? "dev-only-better-auth-secret-change-me";

async function resolveUserLocale(email: string) {
  const found = await db.user.findUnique({
    where: { email },
    select: { preferredLocale: true },
  });
  return found?.preferredLocale === "ar" ? "ar" : "en";
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      phoneNumber: {
        input: true,
        required: false,
        type: "string",
      },
      preferredLocale: {
        input: true,
        required: false,
        type: "string",
      },
    },
  },
  baseURL: authBaseUrl,
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ url, user }) => {
      const locale = await resolveUserLocale(user.email);
      const mail = resetPasswordTemplate({
        locale,
        name: user.name,
        url,
      });
      await sendEmail({
        html: mail.html,
        subject: mail.subject,
        text: mail.text,
        to: user.email,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ url, user }) => {
      const locale = await resolveUserLocale(user.email);
      const mail = emailVerificationTemplate({
        locale,
        name: user.name,
        url,
      });
      await sendEmail({
        html: mail.html,
        subject: mail.subject,
        text: mail.text,
        to: user.email,
      });
    },
  },
  socialProviders: hasGoogleOAuth
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});
