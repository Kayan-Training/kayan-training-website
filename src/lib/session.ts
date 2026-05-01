/**
 * Server-side session helpers.
 */
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdminSession() {
  const session = await getServerSession();

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function requireAuthenticatedSession() {
  const session = await getServerSession();
  if (!session) {
    return null;
  }
  return session;
}
