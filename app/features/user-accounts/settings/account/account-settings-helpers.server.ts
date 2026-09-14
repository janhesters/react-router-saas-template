import type { FileUpload } from "@remix-run/form-data-parser";
import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadOwnedImage } from "~/utils/image-replacement.server";

/**
 * Uploads a user's avatar to storage and returns its public URL.
 *
 * @param file - The avatar file to upload
 * @param userId - The ID of the user whose avatar is being uploaded
 * @param supabase - The Supabase client instance
 * @returns The public URL of the uploaded avatar
 */
export async function uploadUserAvatar({
  file,
  userId,
  supabase,
}: {
  file: File | FileUpload;
  userId: string;
  supabase: SupabaseClient;
}) {
  return uploadOwnedImage({
    file,
    kind: "avatar",
    ownerId: userId,
    supabase,
  });
}
