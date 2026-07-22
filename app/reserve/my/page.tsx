import React from 'react';
import { PublicReservationLookup } from '@/components/reservations/PublicReservationLookup';
import { getLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Look Up Reservation | Public Portal',
  description: 'Check your reservation status using your Reservation Number and Tracking Code.',
};

export default async function PublicReservationLookupPage() {
  const locale = await getLocale();
  return <PublicReservationLookup locale={locale} />;
}

