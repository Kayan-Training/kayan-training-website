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
  // transitive deps (detect-libc, semver, @img/colour) on its own. Under pnpm's
  // default nested-symlink node_modules layout those live several hops away
  // from node_modules/sharp, which tracing missed ("Cannot find module
  // 'detect-libc'", crashing every SSR request that touches an opengraph-image/
  // twitter-image route), and hand-listing exact pnpm store paths to fix that
  // caused duplicate/colliding symlink+real-file entries during Amplify's
  // bundling step instead. Switched to node-linker=hoisted in .npmrc (flat,
  // symlink-free node_modules) so the plain include below — matching Next's own
  // documented example — is correct and sufficient.
  outputFileTracingIncludes: {
    "/*": ["node_modules/sharp/**/*"],
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
