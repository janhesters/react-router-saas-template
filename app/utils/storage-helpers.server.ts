import { randomUUID } from "node:crypto";

import { LOGO_PATH_PREFIX } from "~/features/organizations/organization-constants";
import {
  AVATAR_PATH_PREFIX,
  BUCKET_NAME,
} from "~/features/user-accounts/user-account-constants";
import { supabaseAdminClient } from "~/features/user-authentication/supabase.server";
import { prisma } from "~/utils/database.server";

/**
 * Extracts the bucket and key from a storage URL.
 *
 * @param url - The storage URL.
 * @returns The bucket and key.
 */
export function getBucketAndKeyFromUrl(url?: string | null) {
  if (!url) {
    return { bucket: undefined, key: undefined };
  }

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    throw new Error("Invalid URL");
  }

  // Match both object URLs and render/image URLs under public
  const regex =
    /\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/;
  const match = regex.exec(pathname);

  if (!match) {
    console.error("Invalid storage URL format", pathname);
    return { bucket: undefined, key: undefined };
  }

  const bucket = match[1];
  const key = match[2];
  return { bucket, key };
}

export type ImageKind = "avatar" | "organization-logo";

type OwnedImage = {
  imageUrl: string;
  ownerId: string;
  kind: ImageKind;
};

const imagePrefixes: Record<ImageKind, string> = {
  avatar: AVATAR_PATH_PREFIX,
  "organization-logo": LOGO_PATH_PREFIX,
};
const ownerIdPattern = /^[a-z\d_-]{1,128}$/i;
const extensionPattern = /^[a-z\d]{1,16}$/i;
const uniqueFilenamePattern =
  /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.[a-z\d]{1,16}$/i;

export function createImageStorageKey({
  kind,
  ownerId,
  extension,
}: {
  kind: ImageKind;
  ownerId: string;
  extension: string;
}) {
  if (!ownerIdPattern.test(ownerId) || !extensionPattern.test(extension)) {
    throw new Error("Invalid image storage owner or extension");
  }

  return `${imagePrefixes[kind]}/${ownerId}/${randomUUID()}.${extension.toLowerCase()}`;
}

function parseStorageImageUrl(imageUrl: string, normalizePath = false) {
  try {
    const url = new URL(imageUrl);
    const configuredOrigin = new URL(process.env.VITE_SUPABASE_URL).origin;

    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.origin !== configuredOrigin
    ) {
      return;
    }

    const pathname = normalizePath
      ? new URL(configuredOrigin + decodeURIComponent(url.pathname)).pathname
      : url.pathname;
    const pathPattern = normalizePath
      ? /^\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
      : /^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/;
    const match = pathPattern.exec(pathname);

    if (!match?.[1] || !match[2]) {
      return;
    }

    return { bucket: match[1], key: match[2], url };
  } catch {
    return;
  }
}

function getOwnedImageKey({ imageUrl, ownerId, kind }: OwnedImage) {
  if (!ownerIdPattern.test(ownerId)) {
    return;
  }

  const image = parseStorageImageUrl(imageUrl);
  if (
    !image ||
    image.bucket !== BUCKET_NAME ||
    image.url.username ||
    image.url.password ||
    image.url.hash ||
    imageUrl !== imageUrl.trim() ||
    imageUrl.includes("\\")
  ) {
    return;
  }

  // Reject paths the URL parser would repair, including traversal segments.
  const rawPath = /^https?:\/\/[^/?#]+([^?#]*)/i.exec(imageUrl)?.[1];
  if (rawPath !== image.url.pathname) {
    return;
  }

  const ownerPrefix = `${imagePrefixes[kind]}/${ownerId}`;
  if (image.key.startsWith(`${ownerPrefix}/`)) {
    return uniqueFilenamePattern.test(image.key.slice(ownerPrefix.length + 1))
      ? image.key
      : undefined;
  }

  // Existing flat keys remain eligible for cleanup after their replacement.
  if (
    image.key.startsWith(`${ownerPrefix}.`) &&
    extensionPattern.test(image.key.slice(ownerPrefix.length + 1))
  ) {
    return image.key;
  }
}

function referencesImage(imageUrl: string, key: string) {
  // Render URLs, query parameters and encoded paths can identify the same
  // object as the plain public URL. Retain that object for every live alias.
  const image = parseStorageImageUrl(imageUrl, true);
  if (!image) {
    return false;
  }

  return image.bucket === BUCKET_NAME && image.key === key;
}

export async function removeImageFromStorage(ownedImage: OwnedImage) {
  const key = getOwnedImageKey(ownedImage);

  if (!key) {
    return;
  }

  const referenceLimit = 100;
  const query = {
    select: { imageUrl: true as const },
    take: referenceLimit + 1,
    where: {
      OR: [
        { imageUrl: { contains: key.slice(key.lastIndexOf("/") + 1) } },
        // Percent escapes or URL-normalized control characters can obscure
        // the filename. Inspect those legacy references conservatively too.
        ...["\\%", "\t", "\r", "\n"].map((contains) => ({
          imageUrl: { contains },
        })),
      ],
    },
  };
  const [users, organizations] = await Promise.all([
    prisma.userAccount.findMany(query),
    prisma.organization.findMany(query),
  ]);

  // Bound online cleanup work. Ambiguous legacy references beyond this limit
  // leave the object for a separate orphan cleanup job.
  if (users.length > referenceLimit || organizations.length > referenceLimit) {
    return;
  }

  if (
    [...users, ...organizations].some(({ imageUrl }) =>
      referencesImage(imageUrl, key),
    )
  ) {
    return;
  }

  // Publication must only accept freshly uploaded keys. An unreferenced old
  // key must never be published again after this check.
  const { error } = await supabaseAdminClient.storage
    .from(BUCKET_NAME)
    .remove([key]);

  if (error) {
    throw error;
  }
}

export async function reclaimImageFromStorage(ownedImage: OwnedImage) {
  try {
    await removeImageFromStorage(ownedImage);
  } catch (error) {
    console.error("Failed to reclaim image from storage", {
      error,
      kind: ownedImage.kind,
      ownerId: ownedImage.ownerId,
    });
  }
}
