import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'HEALTHY',
      component: 'PostgreSQL Database',
      latency: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        component: 'PostgreSQL Database',
        error: error?.message || 'Database connection error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
