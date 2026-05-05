import type { NextConfig } from "next";

const awsRegion = process.env.AWS_REGION;
const awsBucket = process.env.AWS_S3_BUCKET;
const s3PublicBase = process.env.AWS_S3_PUBLIC_BASE_URL;

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
  images: {
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
