'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken, setSession, clearSession } from '@/lib/auth';
import * as bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAction(prevState: any, formData: FormData) {
  try {
    if (process.env.PLAYWRIGHT_TEST !== '1') {
      const limiter = await rateLimit('login', 5, 60 * 1000);
      if (!limiter.success) {
        return { error: `Too many login attempts. Please try again in ${limiter.reset} seconds.` };
      }
    }

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
      email: user.username,
      role: user.role,
      name: user.username,
    };

    const token = await signToken(payload);
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
    logger.error('Login error', 'loginAction', { error: String(error) });
    return { error: 'An unexpected error occurred' };
  }

  // Redirect should happen outside try-catch
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}
