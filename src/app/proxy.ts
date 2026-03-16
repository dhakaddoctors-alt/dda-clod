import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Admin Route Protection
  if (url.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token as any).role;
    if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'editor') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Exclude static files, API routes, Next.js internals, Auth assets, and Login/Register pages
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/auth') || 
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/register') || 
    url.pathname.includes('.') // ex: .png, .ico, .js
  ) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  // Layout Routing Logic
  if (isMobile && url.pathname === '/') {
    url.pathname = '/mobile';
    return NextResponse.rewrite(url);
  } else {
    // For Desktop users (all paths) AND Mobile users (any path except root)
    url.pathname = `/desktop${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
