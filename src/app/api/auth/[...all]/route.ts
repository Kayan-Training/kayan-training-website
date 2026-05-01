/**
 * Better Auth route handler for browser and server session operations.
 *
 * The frontend navigation uses `useSession()`, which calls `/api/auth/*`.
 * Keeping this as a thin adapter lets the central auth configuration stay in
 * `src/lib/auth.ts`.
 */
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
