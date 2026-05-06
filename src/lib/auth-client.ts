/**
 * Better Auth client for browser interactions.
 */
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const resolvedBaseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL);

export const authClient = createAuthClient({
  baseURL: resolvedBaseUrl,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
