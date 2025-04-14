import type { RequestHandler } from 'msw';
import { http, HttpResponse } from 'msw';

/*
Storage handlers
*/

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
      ?.split('/');
    const filePath = pathSegments?.join('/'); // Reconstruct the path

    if (!filePath) {
      console.error(
        'MSW Error: Could not determine file path from URL:',
        url.pathname,
      );
      return new HttpResponse('Could not determine file path', { status: 400 });
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
  async ({ params, request }) => {
    const bucketId = params.bucketId as string;

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
            statusCode: '400',
            error: 'Bad Request',
            message: 'Missing or invalid prefixes array',
          },
          { status: 400 },
        );
      }

      console.log(
        `MSW Mock: Simulating removal of paths in bucket ${bucketId}:`,
        prefixes,
      );

      // --- Simulate Specific Error Case (Example) ---
      // if (prefixes.includes('path/that/should/fail.txt')) {
      //   console.warn('MSW Mock (remove): Simulating failure for path/that/should/fail.txt');
      //    return HttpResponse.json(
      //      { statusCode: '500', error: 'Internal Server Error', message: 'Failed to delete file' },
      //      { status: 500 }
      //    );
      // }
      // --- End Error Simulation ---

      // Simulate a successful removal response.
      const deletedFilesData: FileObject[] = prefixes.map(path => ({
        name: path.split('/').pop() ?? path,
        id: undefined,
        updated_at: undefined,
        created_at: undefined,
        last_accessed_at: undefined,
        metadata: undefined,
      }));

      return HttpResponse.json(deletedFilesData);
    } catch (error) {
      // This catch block handles errors during JSON parsing (e.g., empty body, invalid JSON)
      console.error(
        'MSW Error (remove): Could not parse request body as JSON',
        error,
      );
      return HttpResponse.json(
        {
          statusCode: '400',
          error: 'Bad Request',
          message: 'Invalid or empty JSON body',
        },
        { status: 400 },
      );
    }
  },
);

export const supabaseStorageHandlers: RequestHandler[] = [
  uploadMock,
  removeMock,
];
