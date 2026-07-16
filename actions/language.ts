'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setLanguage(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  });
  
  // Revalidate layout and all paths
  revalidatePath('/', 'layout');
}
