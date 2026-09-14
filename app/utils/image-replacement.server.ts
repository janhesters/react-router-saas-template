import type { FileUpload } from "@remix-run/form-data-parser";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminS3Client } from "./s3.server";
import { uploadToStorage } from "./storage.server";
import {
  createImageStorageKey,
  reclaimImageFromStorage,
} from "./storage-helpers.server";
import { BUCKET_NAME } from "~/features/user-accounts/user-account-constants";
import { Prisma } from "~/generated/client";

type ImageOwner = {
  kind: "avatar" | "organization-logo";
  ownerId: string;
};

const imageExtensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadOwnedImage({
  file,
  supabase,
  ...owner
}: ImageOwner & {
  file: File | FileUpload;
  supabase: SupabaseClient;
}) {
  // The original filename never participates in the storage namespace.
  const extension = imageExtensions[file.type];
  if (!extension) {
    throw new Error("Unsupported image type");
  }
  const key = createImageStorageKey({ ...owner, extension });
  const imageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(key)
    .data.publicUrl;

  try {
    await uploadToStorage({
      bucket: BUCKET_NAME,
      client: createAdminS3Client(),
      contentType: file.type,
      file,
      key,
    });
  } catch (error) {
    // An upload can store bytes before its response fails. This key belongs
    // only to this request and has never been submitted for publication.
    await reclaimImageFromStorage({ ...owner, imageUrl });
    throw error;
  }

  return imageUrl;
}

/**
 * Publish only a fresh upload with a compare-and-swap database write. The
 * first request to replace the observed reference wins; stale requests fail.
 * Cleanup is independent and never changes the publication result.
 */
export async function replaceStoredImage<Value>({
  previousImageUrl,
  upload,
  publish,
  ...owner
}: ImageOwner & {
  previousImageUrl: string;
  upload: () => Promise<string>;
  publish: (imageUrl: string) => Promise<Value>;
}) {
  let imageUrl: string;
  try {
    imageUrl = await upload();
  } catch (error) {
    console.error("Image upload failed", error);
    return { reason: "uploadFailed", status: 502, success: false } as const;
  }

  let value: Value;
  try {
    value = await publish(imageUrl);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      await reclaimImageFromStorage({ ...owner, imageUrl });
      return { reason: "imageConflict", status: 409, success: false } as const;
    }
    // A lost connection can leave the commit outcome unknown, including a
    // write still in progress. Retain this upload for deferred orphan cleanup.
    console.error("Image publication failed", error);
    return { reason: "saveFailed", status: 500, success: false } as const;
  }

  await reclaimImageFromStorage({ ...owner, imageUrl: previousImageUrl });
  return { success: true, value } as const;
}
