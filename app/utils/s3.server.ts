import { S3Client } from "@aws-sdk/client-s3";

/**
 * Creates an S3 client with full admin credentials from environment variables.
 * Intended for server-side use only, as it bypasses Row Level Security (RLS).
 *
 * @returns A configured S3Client instance with admin access.
 */
export function createAdminS3Client() {
  return new S3Client({
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.STORAGE_ENDPOINT,
    forcePathStyle: true,
    region: process.env.STORAGE_REGION,
  });
}
