import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';

const secretKey = process.env.AUTH_SECRET || 'super-secret-key-for-local-dev-12345';
const key = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 1 day expiration
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, email: string, role: Role) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
  const session = await encrypt({ userId, email, role, expiresAt });
  const cookieStore = await cookies();
  
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  const session = await decrypt(cookie || '');

  if (!session?.userId) {
    return { isAuth: false, userId: null, role: null };
  }

  return { isAuth: true, userId: session.userId, role: session.role };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
