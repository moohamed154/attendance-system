import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'HEALTHY',
    component: 'Next.js Cache Tag Layer',
    tags: ['reservations', 'settings', 'students', 'reports'],
    timestamp: new Date().toISOString(),
  });
}
