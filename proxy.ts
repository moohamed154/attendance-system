import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { jwtVerify } from 'jose';

const STUDENT_SECRET = process.env.STUDENT_JWT_SECRET || process.env.JWT_SECRET || 'student-secret-key-change-in-production';
const studentKey = new TextEncoder().encode(STUDENT_SECRET);

async function verifyStudentToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, studentKey);
    return payload;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Admin Login Page ─────────────────────────────────────────────────────
  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    // Basic RBAC
    const role = payload.role as string;
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ─── Student Login Page ───────────────────────────────────────────────────
  if (pathname === '/student/login') {
    const studentToken = request.cookies.get('student_token')?.value;
    if (studentToken) {
      const payload = await verifyStudentToken(studentToken);
      if (payload) {
        if ((payload as any).mustChangePassword) {
          return NextResponse.redirect(new URL('/student/change-password', request.url));
        }
        return NextResponse.redirect(new URL('/student', request.url));
      }
    }
    return NextResponse.next();
  }

  // ─── Public Student Routes (QR card pages stay public) ───────────────────
  if (pathname.startsWith('/student/card/')) {
    return NextResponse.next();
  }

  // ─── Protected Student Routes ─────────────────────────────────────────────
  if (pathname.startsWith('/student')) {
    const studentToken = request.cookies.get('student_token')?.value;

    if (!studentToken) {
      return NextResponse.redirect(new URL('/student/login', request.url));
    }

    const payload = await verifyStudentToken(studentToken);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/student/login', request.url));
      response.cookies.delete('student_token');
      return response;
    }

    const mustChangePassword = (payload as any).mustChangePassword;

    // Force password change
    if (mustChangePassword && pathname !== '/student/change-password') {
      return NextResponse.redirect(new URL('/student/change-password', request.url));
    }

    // Don't allow revisiting change-password once done
    if (!mustChangePassword && pathname === '/student/change-password') {
      return NextResponse.redirect(new URL('/student', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
