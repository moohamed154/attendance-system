import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `attendance-backup-${timestamp}.db`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.length),
    },
  });
}
