// import { NextResponse, type NextRequest } from 'next/server';
// import { updateSession } from '@/utils/supabase/middleware';

// Comment out the following function to enable Preview apps in Vercel
// export async function middleware(request: NextRequest) {
//   const mainUrl = 'https://gentube.ai';
//
//   if (request.nextUrl.hostname.endsWith('.vercel.app')) {
//     return NextResponse.redirect(mainUrl);
//   }
//
//   return await updateSession(request);
// }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
