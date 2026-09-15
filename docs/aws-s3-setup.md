# AWS S3 Media Setup

This guide configures S3 uploads for the dashboard media pipeline (`presign -> upload -> complete`) used by posts/pages/events/media library.

## 1) Create Bucket

1. Open AWS S3 and create a bucket.
2. Keep **Block Public Access ON** (recommended) if you use CloudFront/signed delivery.
3. If you want direct public object URLs from S3 for now, allow public read via bucket policy below.

## 2) CORS Configuration

In bucket **Permissions -> CORS**, set:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Replace `https://your-domain.com` with your production frontend domain.

## 3) Optional Public Read Bucket Policy

If you are not using private delivery/CDN auth yet:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME/media/*"]
    }
  ]
}
```

## 4) IAM User / Access

Create an IAM user (programmatic access) with minimum bucket access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME/media/*"]
    }
  ]
}
```

## 5) Environment Variables

Add to `.env`:

```bash
AWS_REGION=eu-central-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Optional: use CloudFront or custom host (without trailing slash)
AWS_S3_PUBLIC_BASE_URL=https://your-cdn-domain.com
```

`AWS_S3_PUBLIC_BASE_URL` is optional; if missing, app uses:
`https://<bucket>.s3.<region>.amazonaws.com`

## 6) Next.js Image Host Configuration

`next.config.ts` now auto-adds S3 host patterns from `AWS_REGION`, `AWS_S3_BUCKET`, and `AWS_S3_PUBLIC_BASE_URL`.

After changing env values, restart dev/build server.

## 7) Verify Flow

1. Open dashboard media upload.
2. Upload an image/video/pdf.
3. Confirm:
   - progress indicator moves to `100%`
   - row appears in media list
   - object exists in S3 under `media/`
4. Delete media and confirm:
   - DB row removed
   - object deleted from S3 (best effort)

## Current Limits

- Max upload size: `150MB`
- Allowed mime types:
  - images: jpeg/png/webp/avif/svg
  - video: mp4/webm
  - document: pdf

## CLI Smoke Test (Upload + Delete)

Run:

```bash
pnpm s3:smoke
```

This test does a full S3 roundtrip using your current env:
1. creates presigned upload
2. uploads a small test file
3. verifies object exists
4. deletes object
5. verifies object no longer exists
