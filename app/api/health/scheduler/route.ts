import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const pendingExpiredCount = await prisma.reservation.count({
    where: {
      status: 'PENDING',
      expiresAt: { lte: new Date() },
    },
  });

  return NextResponse.json({
    status: 'HEALTHY',
    component: 'Reservation Expiration Scheduler',
    pendingOverdueCount: pendingExpiredCount,
    endpoint: '/api/scheduler/expire-reservations',
    timestamp: new Date().toISOString(),
  });
}
