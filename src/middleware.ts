import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// 1. Specify protected and public routes
const adminRoutes = ['/admin'];
const studentRoutes = ['/student'];
const publicRoutes = ['/login', '/'];

export async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));
  const isStudentRoute = studentRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie || '');

  // 4. Redirect to /login if the user is not authenticated
  if ((isAdminRoute || isStudentRoute) && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Role-based authorization
  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/student/dashboard', req.nextUrl));
  }

  if (isStudentRoute && session?.role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
  }

  // 6. Redirect to dashboard if the user is authenticated and trying to access public routes
  if (
    isPublicRoute &&
    session?.userId &&
    !req.nextUrl.pathname.startsWith('/admin/dashboard') &&
    !req.nextUrl.pathname.startsWith('/student/dashboard')
  ) {
    if (session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    } else {
      return NextResponse.redirect(new URL('/student/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
