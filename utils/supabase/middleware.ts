import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({
            name,
            value,
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({
            name,
            value: '',
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value: '',
            ...options
          });
        }
      }
    }
  );

  return { supabase, response };
};

export const updateSession = async (request: NextRequest) => {
  try {
    const { supabase, response } = createClient(request);
    const pathname = request.nextUrl.pathname;

    // Check for special paths that should bypass session validation
    const publicPaths = ['/signin', '/signup', '/', '/gallery'];
    
    // Skip validation for public pages, API routes, and static assets
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
    const isStaticPath = pathname.startsWith('/_next/') || pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp)$/);
    
    try {
      // Try to get the user - this will refresh the session if valid but expired
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // If there's an error with the session or no user found, sign them out
      // But only if this isn't a public path or static asset
      if ((error || !user) && !isPublicPath && !isStaticPath) {
        // Don't redirect public routes, API routes or static assets
        const publicPaths = [
          '/session-expired',
          '/signin',
          '/signup',
          '/gallery',
          '/about',
          '/pricing',
          '/terms',
          '/privacy',
          '/contact',
          '/faq',
          '/blog',
          '/info',
          '/investors',
          '/direct-signin',
          '/direct-home',
          '/clear-session',
          '/signin/complete-signout',
          '/',
          '/auth/callback',
          '/auth/reset_password',
          '/verify'
        ];
        
        // Check for root path (with or without query parameters) and other public paths
        const isPublicPathMatch = 
          pathname === '/' ||
          publicPaths.some(path => 
            pathname === path || pathname.startsWith(path + '/')
          );
        
        if (!pathname.startsWith('/api/') && 
            !pathname.startsWith('/_next/') &&
            !isPublicPathMatch) {
          // Create a simple redirect to our dedicated session-expired page
          const redirectUrl = new URL('/session-expired', request.url);
          
          // Preserve the current URL to redirect back after signing in
          if (pathname !== '/' && !pathname.includes('/signin') && !pathname.includes('/signup')) {
            redirectUrl.searchParams.set('returnTo', pathname);
          }
          
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (sessionError) {
      console.error('Session refresh error:', sessionError);
      // Continue with response even if session validation fails
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    console.error('Supabase client creation error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }
};
