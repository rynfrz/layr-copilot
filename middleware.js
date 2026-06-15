import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/setup'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname === p) || pathname.startsWith('/api/auth/')) return NextResponse.next();

  const token = req.cookies.get('layr_session')?.value;
  let valid = false;
  if (token && process.env.SESSION_SECRET) {
    try { await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET)); valid = true; } catch {}
  }
  if (!valid) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|login|setup).*)'] };
