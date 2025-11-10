import fs from "node:fs/promises";
import path from "node:path";
import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";

/*
Storage handlers
*/

const FIXTURES_DIR = path.join(
  process.cwd(),
  "app",
  "tests",
  "mocks",
  "fixtures",
);
const MOCK_STORAGE_DIR = path.join(FIXTURES_DIR, "supabase-storage");

// Map of file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".xml": "application/xml",
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// Store multipart upload parts in memory
// Key: uploadId, Value: Map of partNumber to Buffer
const multipartUploads = new Map<string, Map<number, Buffer>>();

const uploadMock = http.post(
  // Use a wildcard for the path
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/:bucketName/*`,
  ({ params, request }) => {
    const bucketName = params.bucketName as string;
    // Note: MSW's path matching might capture the full path after bucketName
    // in the wildcard (*). We might need to extract it if needed, but
    // for the response, constructing it simply might be enough.

    // To get the actual file path intended by the client:
    // The path is the part of the URL *after* the bucket name.
    const url = new URL(request.url);
    const pathSegments = url.pathname
      .split(`/storage/v1/object/${bucketName}/`)[1]
      ?.split("/");
    const filePath = pathSegments?.join("/"); // Reconstruct the path

    if (!filePath) {
      console.error(
        "MSW Error: Could not determine file path from URL:",
        url.pathname,
      );
      return new HttpResponse("Could not determine file path", { status: 400 });
    }

    // Simulate reading the file or form data if needed for validation,
    // but for a basic mock, just return the success response.

    // Match the typical Supabase success response structure more closely
    // The Key usually includes the bucket name and the full path.
    const fullPathKey = `${bucketName}/${filePath}`;

    // Return the expected response format (primarily the Key)
    return HttpResponse.json({ Key: fullPathKey });
  },
);

// Define a minimal FileObject type for the mock response,
// based on what the 'remove' method seems to expect in its success case.
// Adjust this based on the actual structure if needed.
type FileObject = {
  name: string;
  id: string | undefined;
  updated_at: string | undefined;
  created_at: string | undefined;
  last_accessed_at: string | undefined;
  metadata: Record<string, unknown> | undefined;
  // bucket_id?: string; // Optional: might be useful
};

// Define the expected structure of the request body for remove
type RemoveRequestBody = {
  prefixes?: string[];
};

const removeMock = http.delete(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/:bucketId`,
  async ({ request, params }) => {
    try {
      // Use the generic type argument for request.json()
      // This tells TS what shape to expect *if* parsing succeeds.
      // The type of requestBody inside this try block will be RemoveRequestBody | null
      const requestBody = (await request.json()) as RemoveRequestBody | null;

      // Check if the body was parsed and has the expected structure
      const prefixes = requestBody?.prefixes; // Safely access prefixes

      if (!prefixes || !Array.isArray(prefixes) || prefixes.length === 0) {
        console.error(
          'MSW Error (remove): Missing, invalid, or empty "prefixes" in request body:',
          requestBody, // Log the actual parsed body for debugging
        );
        return HttpResponse.json(
          {
            error: "Bad Request",
            message: "Missing or invalid prefixes array",
            statusCode: "400",
          },
          { status: 400 },
        );
      }

      const bucket = params.bucketId as string;

      // Actually delete files from disk
      const deletedFilesData: FileObject[] = [];
      for (const prefix of prefixes) {
        const keyParts = prefix.split("/");
        const filePath = path.join(MOCK_STORAGE_DIR, bucket, ...keyParts);
        try {
          await fs.unlink(filePath);
          console.info(`🗑️  Deleted file: ${filePath}`);
          deletedFilesData.push({
            created_at: undefined,
            id: undefined,
            last_accessed_at: undefined,
            metadata: undefined,
            name: prefix.split("/").pop() ?? prefix,
            updated_at: undefined,
          });
        } catch {
          // File doesn't exist, but still add to response
          deletedFilesData.push({
            created_at: undefined,
            id: undefined,
            last_accessed_at: undefined,
            metadata: undefined,
            name: prefix.split("/").pop() ?? prefix,
            updated_at: undefined,
          });
        }
      }

      return HttpResponse.json(deletedFilesData);
    } catch (error) {
      // This catch block handles errors during JSON parsing (e.g., empty body, invalid JSON)
      console.error(
        "MSW Error (remove): Could not parse request body as JSON",
        error,
      );
      return HttpResponse.json(
        {
          error: "Bad Request",
          message: "Invalid or empty JSON body",
          statusCode: "400",
        },
        { status: 400 },
      );
    }
  },
);

/*
  Server‐side S3 uploads (AWS SDK v3 / @supabase's S3 endpoint)
*/
const s3UploadMock: RequestHandler = http.put(
  // Path‐style S3 endpoint under Supabase:
  //   https://<project>.supabase.co/storage/v1/s3/<bucket>/<key>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  async ({ params, request }) => {
    const bucket = params.bucketName as string;
    const url = new URL(request.url);
    // everything after `/storage/v1/s3/<bucket>/`
    const objectKey = url.pathname.split(`/storage/v1/s3/${bucket}/`)[1];
    if (!objectKey) {
      return new HttpResponse("Missing key", { status: 400 });
    }

    // Save file to disk
    const keyParts = objectKey.split("/");
    const filePath = path.join(MOCK_STORAGE_DIR, bucket, ...keyParts);
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });

    const fileBuffer = Buffer.from(await request.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    console.info(`💾 Saved file to: ${filePath}`);

    // S3's PutObject returns an empty body + an ETag header
    return new HttpResponse(undefined, {
      headers: { ETag: '"mocked-etag"' },
      status: 200,
    });
  },
);

const s3DeleteMock: RequestHandler = http.delete(
  // Matches DELETE on https://<project>/storage/v1/s3/<bucket>/<key>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  async ({ params, request }) => {
    const bucket = params.bucketName as string;
    const url = new URL(request.url);
    const objectKey = url.pathname.split(`/storage/v1/s3/${bucket}/`)[1];

    if (objectKey) {
      const keyParts = objectKey.split("/");
      const filePath = path.join(MOCK_STORAGE_DIR, bucket, ...keyParts);
      try {
        await fs.unlink(filePath);
        console.info(`🗑️  Deleted file: ${filePath}`);
      } catch {
        // File doesn't exist, but that's ok
      }
    }

    return new HttpResponse(undefined, { status: 204 });
  },
);

const s3InitMultipartMock: RequestHandler = http.post(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  ({ params, request }) => {
    const url = new URL(request.url);

    // Check if this is an uploads request
    if (url.searchParams.get("uploads") === null) {
      return new HttpResponse("Not an uploads request", { status: 400 });
    }

    if (!params.bucketName || typeof params.bucketName !== "string") {
      return new HttpResponse("Missing bucket name", { status: 400 });
    }

    const keyPath = url.pathname.split(
      `/storage/v1/s3/${params.bucketName}/`,
    )[1];

    // Generate a unique upload ID
    const uploadId = `mock-upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Initialize parts storage for this upload
    multipartUploads.set(uploadId, new Map());

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<InitiateMultipartUploadResult>
  <Bucket>${params.bucketName}</Bucket>
  <Key>${keyPath}</Key>
  <UploadId>${uploadId}</UploadId>
</InitiateMultipartUploadResult>`;
    return new HttpResponse(xml, {
      headers: { "Content-Type": "application/xml" },
      status: 200,
    });
  },
);

/*
  Server-side S3 multipart upload: upload part
*/
const s3UploadPartMock: RequestHandler = http.put(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  async ({ request }) => {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    const partNumber = url.searchParams.get("partNumber");
    if (!uploadId || !partNumber) {
      return new HttpResponse("Missing uploadId or partNumber", {
        status: 400,
      });
    }

    // Store the part data in memory
    const partData = Buffer.from(await request.arrayBuffer());
    const parts = multipartUploads.get(uploadId);
    if (parts) {
      parts.set(Number.parseInt(partNumber, 10), partData);
    }

    return new HttpResponse(undefined, {
      headers: { ETag: `"mocked-part-etag-${partNumber}"` },
      status: 200,
    });
  },
);

/*
  Server-side S3 multipart upload: complete
*/
const s3CompleteMultipartMock: RequestHandler = http.post(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/s3/:bucketName/*`,
  async ({ params, request }) => {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    if (!uploadId) {
      return new HttpResponse("Missing uploadId", { status: 400 });
    }

    if (!params.bucketName || typeof params.bucketName !== "string") {
      return new HttpResponse("Missing bucket name", { status: 400 });
    }

    const bucket = params.bucketName;
    const keyPath = url.pathname.split(`/storage/v1/s3/${bucket}/`)[1];

    if (!keyPath) {
      return new HttpResponse("Missing key path", { status: 400 });
    }

    // Combine all parts and write to disk
    const parts = multipartUploads.get(uploadId);
    if (parts && parts.size > 0) {
      // Sort parts by part number and combine them
      const sortedParts = Array.from(parts.entries()).sort(
        (a, b) => a[0] - b[0],
      );
      const combinedBuffer = Buffer.concat(
        sortedParts.map(([_, buffer]) => buffer),
      );

      // Save to disk
      const keyParts = keyPath.split("/");
      const filePath = path.join(MOCK_STORAGE_DIR, bucket, ...keyParts);
      const parentDir = path.dirname(filePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(filePath, combinedBuffer);

      console.info(`💾 Completed multipart upload to: ${filePath}`);

      // Clean up the stored parts
      multipartUploads.delete(uploadId);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CompleteMultipartUploadResult>
  <Location>${request.url.split("?")[0]}</Location>
  <Bucket>${bucket}</Bucket>
  <Key>${keyPath}</Key>
  <ETag>"mocked-complete-etag"</ETag>
</CompleteMultipartUploadResult>`;
    return new HttpResponse(xml, {
      headers: { "Content-Type": "application/xml" },
      status: 200,
    });
  },
);

/*
  GET handler for public object URLs
  This is what gets called when the app requests uploaded files
*/
const getPublicObjectMock: RequestHandler = http.get(
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/:bucketName/*`,
  async ({ params, request }) => {
    const bucket = params.bucketName as string;
    const url = new URL(request.url);
    const objectKey = url.pathname.split(
      `/storage/v1/object/public/${bucket}/`,
    )[1];

    if (!objectKey) {
      return new HttpResponse("Missing key", { status: 400 });
    }

    const keyParts = objectKey.split("/");
    const filePath = path.join(MOCK_STORAGE_DIR, bucket, ...keyParts);

    try {
      const file = await fs.readFile(filePath);
      const contentType = getMimeType(keyParts.at(-1) || "");

      return new HttpResponse(file, {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": file.length.toString(),
          "Content-Type": contentType,
        },
      });
    } catch {
      return new HttpResponse("Not found", { status: 404 });
    }
  },
);

export const supabaseStorageHandlers: RequestHandler[] = [
  uploadMock,
  removeMock,
  getPublicObjectMock,
  s3UploadMock,
  s3DeleteMock,
  s3InitMultipartMock,
  s3UploadPartMock,
  s3CompleteMultipartMock,
];
