import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
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
    if (userRole !== 'admin' && userRole !== 'super_admin') {
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

  // Example logic:
  // If user is on Mobile and trying to access root or dashboard
  // We rewrite them to the (mobile) route group equivalent if needed,
  // but since Route Groups are completely transparent to the URL, 
  // we actually need to use folder-based routing internally 
  // if we want Next.js to serve them separately.
  
  // *Important Next.js Behavior Note*:
  // Route groups `(desktop)` and `(mobile)` do NOT change the URL structure.
  // We can't actually rewrite to `/` and let it auto-resolve between groups.
  // Instead, the structure should be:
  // src/app/desktop/...
  // src/app/mobile/...
  // And the middleware rewrites the ROOT `/` to either `/desktop` or `/mobile`.
  
  // Let's implement the rewrite logic assuming we use actual folders for routing
  // We currently only have a dedicated mobile experience for the root landing page.
  // For all other routes (directory, profile, admin, etc.), we want Mobile users 
  // to fall back to the existing responsive Desktop views to avoid 404s.
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
