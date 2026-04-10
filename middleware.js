import { NextResponse } from 'next/server'

// Set this to false when you're ready to launch
const SITE_LIVE = false

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Always allow admin to keep working
  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Allow internal API calls (from your own server)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // If site is live, let everyone through
  if (SITE_LIVE) {
    return NextResponse.next()
  }

  // Otherwise show maintenance page
  return NextResponse.rewrite(new URL('/maintenance', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|public).*)'],
}
