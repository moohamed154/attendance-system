import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const backupPath = path.join(process.cwd(), 'prisma', `dev.db.bak-${Date.now()}`);

    // Backup current db before overwriting
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Basic SQLite magic bytes check: SQLite files start with "SQLite format 3\000"
    const magic = buffer.slice(0, 16).toString('ascii');
    if (!magic.startsWith('SQLite format 3')) {
      return NextResponse.json({ error: 'Invalid SQLite file. Please upload a valid .db backup.' }, { status: 400 });
    }

    fs.writeFileSync(dbPath, buffer);

    return NextResponse.json({ success: true, message: 'Database restored successfully. Please restart the server.' });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Failed to restore database' }, { status: 500 });
  }
}
