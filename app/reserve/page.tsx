import React from 'react';
import { PublicReservationForm } from '@/components/reservations/PublicReservationForm';

export const metadata = {
  title: 'Public Reservation Portal | Book Your Class',
  description: 'Reserve your classroom seat easily without logging in.',
};

export default function PublicReservationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-8 px-4 sm:px-6 dir-rtl">
      <PublicReservationForm locale="ar" />
    </main>
  );
}
