import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';

const STUDENT_SECRET = process.env.STUDENT_JWT_SECRET || process.env.JWT_SECRET || 'student-secret-key-change-in-production';
const studentKey = new TextEncoder().encode(STUDENT_SECRET);

export interface StudentTokenPayload {
  studentDbId: string;
  studentId: string;
  name: string;
  mustChangePassword: boolean;
  iat?: number;
  exp?: number;
}

export async function signStudentToken(payload: Omit<StudentTokenPayload, 'iat' | 'exp'>) {
  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(studentKey);
}

export async function verifyStudentToken(token: string): Promise<StudentTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, studentKey);
    return payload as unknown as StudentTokenPayload;
  } catch {
    return null;
  }
}

export const getStudentSession = cache(async (): Promise<StudentTokenPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('student_token')?.value;
  if (!token) return null;
  return await verifyStudentToken(token);
});

export async function setStudentSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('student_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearStudentSession() {
  const cookieStore = await cookies();
  cookieStore.delete('student_token');
}
