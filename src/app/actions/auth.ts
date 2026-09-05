'use server';

import { createSession, deleteSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordsMatch) {
      return { error: 'Invalid email or password.' };
    }

    await createSession(user.id, user.email, user.role);

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function logoutAction() {
  await deleteSession();
  return { success: true };
}
