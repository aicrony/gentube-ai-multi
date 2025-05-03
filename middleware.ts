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

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes starting with /api/
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
