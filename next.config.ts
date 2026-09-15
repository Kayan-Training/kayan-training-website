import type { NextConfig } from "next";

const awsRegion = process.env.S3_REGION;
const awsBucket = process.env.S3_BUCKET;
const s3PublicBase = process.env.S3_PUBLIC_BASE_URL;

function getHostnameFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  const raw = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const s3HostFromBucket =
  awsRegion && awsBucket ? `${awsBucket}.s3.${awsRegion}.amazonaws.com` : null;
const s3HostFromCustomBase = getHostnameFromUrl(s3PublicBase);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // sharp is in Next's default serverExternalPackages list, so it isn't bundled —
  // Next's own output tracing has to pick up its native binaries and small
  // transitive deps instead. pnpm stores those several symlink hops deep under
  // node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg> (not as descendants of
  // node_modules/sharp itself), which tracing missed — "Cannot find module
  // 'detect-libc'" crashed every SSR request that touches an opengraph-image/
  // twitter-image route on Amplify's Lambda runtime (linux). Force-include
  // sharp's own tree plus only the linux x64/arm64 native binaries (the ones a
  // Lambda runtime can actually be) — a broader `@img+sharp-*` glob previously
  // pulled in darwin/win32/wasm32/musl/ppc64/etc binaries on every single route
  // via the `/*` key, ballooning every function bundle and failing to deploy on
  // Vercel (function size limit) even though the build itself succeeded.
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/sharp/**/*",
      "node_modules/.pnpm/sharp@*/node_modules/**/*",
      "node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/**/*",
      "node_modules/.pnpm/@img+sharp-linux-arm64@*/node_modules/**/*",
      "node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/**/*",
      "node_modules/.pnpm/@img+sharp-libvips-linux-arm64@*/node_modules/**/*",
      "node_modules/.pnpm/@img+colour@*/node_modules/**/*",
      "node_modules/.pnpm/detect-libc@*/node_modules/**/*",
      "node_modules/.pnpm/semver@*/node_modules/**/*",
    ],
  },
  images: {
    qualities: [72, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "kayan-training-website.s3.ap-south-1.amazonaws.com",
      },
      ...(s3HostFromBucket
        ? [{ protocol: "https" as const, hostname: s3HostFromBucket }]
        : []),
      ...(s3HostFromCustomBase
        ? [{ protocol: "https" as const, hostname: s3HostFromCustomBase }]
        : []),
    ],
  },
};

export default nextConfig;
