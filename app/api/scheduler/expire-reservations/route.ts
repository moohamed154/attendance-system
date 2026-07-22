import { NextResponse } from 'next/server';
import { expirePendingReservations } from '@/actions/reservations/reservations';

export async function GET() {
  const result = await expirePendingReservations();
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: result.count, timestamp: new Date().toISOString() });
}

export async function POST() {
  const result = await expirePendingReservations();
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: result.count, timestamp: new Date().toISOString() });
}
