import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token as any).role;
    if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'editor') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // 2. static files, API routes, Next.js internals, Auth assets, and Login/Register pages
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.includes('.') // ex: .png, .ico, .js
  ) {
    return NextResponse.next();
  }

  // 3. Layout Routing Logic (Desktop/Mobile separation)
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  if (isMobile && pathname === '/') {
    return NextResponse.rewrite(new URL('/mobile', request.url));
  } else {
    // Rewrite all other requests to /desktop/...
    const destination = `/desktop${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(new URL(destination, request.url));
  }
}
