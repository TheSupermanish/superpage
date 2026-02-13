import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /@username to /username
  if (pathname.startsWith('/@')) {
    const username = pathname.slice(2).split('/')[0];
    const rest = pathname.slice(2 + username.length);
    
    // Rewrite the URL internally
    const url = request.nextUrl.clone();
    url.pathname = `/${username}${rest}`;
    
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
