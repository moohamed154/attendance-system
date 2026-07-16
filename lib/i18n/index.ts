'use server';

import { cookies } from 'next/headers';
import en from './dictionaries/en.json';
import ar from './dictionaries/ar.json';

const dictionaries = { en, ar };

export type Dictionary = typeof en;
export type Locale = keyof typeof dictionaries;

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  return locale === 'ar' ? 'ar' : 'en';
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
