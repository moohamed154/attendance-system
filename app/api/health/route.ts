import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const buildTime = new Date().toISOString();

export async function GET() {
  let dbStatus = 'disconnected';
  let responseTimeMs = 0;
  
  try {
    const startTime = Date.now();
    // Run a lightweight database check using SELECT 1
    await prisma.$queryRawUnsafe('SELECT 1');
    responseTimeMs = Date.now() - startTime;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connection failed in health check:', error);
    return NextResponse.json({
      status: 'error',
      database: 'unavailable',
      databaseProvider: 'Neon PostgreSQL',
      version: '0.1.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      buildTime,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();

  return NextResponse.json({
    status: 'ok',
    database: dbStatus,
    databaseProvider: 'Neon PostgreSQL',
    responseTime: `${responseTimeMs}ms`,
    version: '0.1.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    buildTime,
    uptime: Math.floor(uptime),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
}
