import "dotenv/config";

import { randomUUID } from "node:crypto";

import {
  createPresignedUpload,
  deleteFromS3ByKey,
  getS3Config,
  s3ObjectExists,
} from "@/lib/storage/s3";

async function main() {
  const cfg = getS3Config();
  if (!cfg) {
    throw new Error(
      "S3 is not configured. Set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.",
    );
  }

  const filename = `s3-smoke-${Date.now()}-${randomUUID().slice(0, 8)}.txt`;
  const mimeType = "text/plain";
  const payload = Buffer.from(
    `kayan s3 smoke test ${new Date().toISOString()}\n`,
    "utf8",
  );

  console.log(`Using bucket: ${cfg.bucket}`);
  const { key, uploadUrl, fileUrl } = await createPresignedUpload({
    filename,
    mimeType,
  });
  console.log(`Presigned key: ${key}`);

  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: payload,
  });
  if (!putResponse.ok) {
    throw new Error(`S3 PUT failed with status ${putResponse.status}`);
  }
  console.log("Upload: OK");

  const existsAfterUpload = await s3ObjectExists(key);
  if (!existsAfterUpload) {
    throw new Error("Uploaded object is not readable via HEAD.");
  }
  console.log("HEAD after upload: OK");

  await deleteFromS3ByKey(key);
  console.log("Delete: OK");

  const existsAfterDelete = await s3ObjectExists(key);
  if (existsAfterDelete) {
    throw new Error("Object still exists after delete.");
  }
  console.log("HEAD after delete: OK");
  console.log(`Public URL pattern: ${fileUrl}`);
  console.log("S3 smoke test passed.");
}

main().catch((error) => {
  console.error("S3 smoke test failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
