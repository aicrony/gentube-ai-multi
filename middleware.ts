import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const mainUrl = 'https://gentube.ai';

  // Comment out the following function to enable Preview apps in Vercel
  if (
    request.nextUrl.hostname.endsWith('.vercel.app')
    // || request.nextUrl.hostname === 'test.gentube.ai'
  ) {
    return NextResponse.redirect(mainUrl);
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-User-Id, X-Forwarded-For',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '86400' // 24 hours
      }
    });
  }

  // Add CORS headers to all responses
  const response = await updateSession(request);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-User-Id, X-Forwarded-For'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Also include API routes that need CORS handling
    '/api/getSignedUploadUrl',
    '/api/saveUploadActivity'
  ]
};
