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

export const supabaseStorageHandlers: RequestHandler[] = [uploadMock];
