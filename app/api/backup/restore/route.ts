import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { restoreBackup } from '@/lib/backup-service';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = await rateLimit('backup-restore', 3, 60 * 1000);
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const restoreResult = await restoreBackup(buffer);
    if (!restoreResult.success) {
      return NextResponse.json({ error: restoreResult.error || 'Invalid backup file' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Database restored successfully. Changes are applied instantly.' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore database' }, { status: 500 });
  }
}
