import React from 'react';
import { PublicReservationForm } from '@/components/reservations/PublicReservationForm';
import { getLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Public Reservation Portal | Book Your Class',
  description: 'Reserve your classroom seat easily without logging in.',
};

export default async function PublicReservationPage() {
  const locale = await getLocale();
  return <PublicReservationForm locale={locale} />;
}

