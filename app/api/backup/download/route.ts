import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createBackup } from '@/lib/backup-service';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await rateLimit('backup-download', 5, 60 * 1000);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { metadata, buffer } = await createBackup('manual');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${metadata.filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error: any) {
    logger.error('Backup download error', 'backup-download', { error: String(error) });
    return NextResponse.json({ error: error.message || 'Failed to generate backup' }, { status: 500 });
  }
}
