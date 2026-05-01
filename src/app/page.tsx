/**
 * Root page intentionally returns null.
 *
 * Requests to `/` are redirected in `src/proxy.ts` to the default locale (`/ar`).
 */
export default function RootPage() {
  return null;
}
