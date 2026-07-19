'use server';

import { cookies } from 'next/headers';
import en from './dictionaries/en.json';
import ar from './dictionaries/ar.json';

const dictionaries = { en, ar };

export type Dictionary = typeof en;
export type Locale = keyof typeof dictionaries;

import { cache } from 'react';

export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  return locale === 'ar' ? 'ar' : 'en';
});

export const getDictionary = cache(async (): Promise<Dictionary> => {
  const locale = await getLocale();
  return dictionaries[locale];
});
