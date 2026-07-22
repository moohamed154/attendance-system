import React from 'react';
import { PublicReservationLookup } from '@/components/reservations/PublicReservationLookup';

export const metadata = {
  title: 'Look Up Reservation | Public Portal',
  description: 'Check your reservation status using your Reservation Number and Tracking Code.',
};

export default function PublicReservationLookupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-8 px-4 sm:px-6 dir-rtl">
      <PublicReservationLookup locale="ar" />
    </main>
  );
}
