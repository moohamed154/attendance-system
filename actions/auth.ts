'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/auth';
import * as bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return { error: 'Invalid username or password format' };
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: 'Invalid username or password' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: 'Invalid username or password' };
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = await require('@/lib/auth').signToken(payload);
    await setSession(token);
    
    // Log login action
    await prisma.activityLog.create({
      data: {
        action: 'USER_LOGIN',
        userId: user.id,
        role: user.role,
        target: 'System',
        description: `User ${user.username} logged in successfully`,
      }
    });

  } catch (error) {
    console.error('Login error', error);
    return { error: 'An unexpected error occurred' };
  }

  // Redirect should happen outside try-catch
  redirect('/dashboard');
}

export async function logoutAction() {
  await require('@/lib/auth').clearSession();
  redirect('/login');
}
