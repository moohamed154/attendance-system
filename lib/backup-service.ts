import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { prisma } from './prisma';
import { logger } from './logger';

export interface BackupMetadata {
  filename: string;
  date: string;
  size: number;
  checksum: string;
  databaseVersion: string;
  type: 'daily' | 'weekly' | 'manual';
  isValid: boolean;
}

const BACKUP_DIR = path.join(process.cwd(), 'prisma', 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    try {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    } catch {
      // In serverless environments, fallback to /tmp/backups
      const fallbackDir = path.join('/tmp', 'backups');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    }
  }
  return BACKUP_DIR;
}

/**
 * Calculates SHA-256 checksum of a buffer.
 */
function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validates a gzip file header (starts with 0x1f 0x8b magic bytes).
 */
function validateBackupHeader(buffer: Buffer): boolean {
  if (buffer.length < 2) return false;
  return buffer[0] === 0x1f && buffer[1] === 0x8b;
}

/**
 * Helper to convert string date values back to JavaScript Date objects.
 */
function mapDates<T>(items: T[], dateFields: string[]): T[] {
  return items.map(item => {
    const newItem = { ...item } as any;
    dateFields.forEach(field => {
      if (newItem[field]) {
        newItem[field] = new Date(newItem[field]);
      } else {
        newItem[field] = null;
      }
    });
    return newItem;
  });
}

/**
 * Runs a database serialization backup asynchronously (gzip JSON).
 */
export async function createBackup(type: 'daily' | 'weekly' | 'manual' = 'manual'): Promise<BackupMetadata> {
  const activeDir = ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-${type}-${timestamp}.json.gz`;
  const backupFilePath = path.join(activeDir, backupFilename);
  const metadataFilePath = path.join(activeDir, `backup-${type}-${timestamp}-meta.json`);

  try {
    // 1. Query all tables in the database
    const dbData = {
      users: await prisma.user.findMany(),
      students: await prisma.student.findMany(),
      sessions: await prisma.session.findMany(),
      attendances: await prisma.attendance.findMany(),
      payments: await prisma.payment.findMany(),
      transactions: await prisma.paymentTransaction.findMany(),
      settings: await prisma.setting.findMany(),
      activities: await prisma.activityLog.findMany(),
      auditLogs: await prisma.attendanceAuditLog.findMany(),
      snapshots: await prisma.monthlyGenerationSnapshot.findMany(),
    };

    // 2. Serialize and compress
    const jsonStr = JSON.stringify({
      metadata: {
        date: new Date().toISOString(),
        provider: 'Neon PostgreSQL',
        version: '1.0'
      },
      data: dbData
    });

    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));

    // 3. Calculate metrics
    const checksum = calculateChecksum(compressedBuffer);
    const isValid = validateBackupHeader(compressedBuffer);

    // 4. Save
    fs.writeFileSync(backupFilePath, compressedBuffer);

    const metadata: BackupMetadata = {
      filename: backupFilename,
      date: new Date().toISOString(),
      size: compressedBuffer.length,
      checksum,
      databaseVersion: '1.0 (Neon PostgreSQL)',
      type,
      isValid,
    };

    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
    
    logger.info(`Neon PostgreSQL backup ${backupFilename} created successfully. Size: ${metadata.size} bytes`, 'BackupService');

    // Trigger retention cleanup in the background
    cleanupOldBackups(activeDir).catch(err => {
      logger.error('Failed running backup retention policy', 'BackupService', { error: String(err) });
    });

    return metadata;
  } catch (error: any) {
    logger.error('Failed to create database backup', 'BackupService', { error: error.message });
    throw error;
  }
}

/**
 * Restores database from a gzip JSON backup file inside a single SQL Transaction.
 */
export async function restoreBackup(gzipBuffer: Buffer): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify gzip header
    if (!validateBackupHeader(gzipBuffer)) {
      return { success: false, error: 'Invalid backup file format. Expected a valid gzip compressed file.' };
    }

    // 2. Decompress and parse
    const jsonBuffer = zlib.gunzipSync(gzipBuffer);
    const backupObj = JSON.parse(jsonBuffer.toString('utf8'));

    if (!backupObj.metadata || !backupObj.data) {
      return { success: false, error: 'Invalid backup file structure. Metadata or data missing.' };
    }

    const { data } = backupObj;

    // 3. Map dates back to Date objects
    const users = mapDates(data.users || [], ['createdAt', 'updatedAt']);
    const sessions = mapDates(data.sessions || [], ['createdAt', 'updatedAt']);
    const students = mapDates(data.students || [], ['createdAt', 'updatedAt']);
    const attendances = mapDates(data.attendances || [], ['date', 'createdAt', 'updatedAt']);
    const auditLogs = mapDates(data.auditLogs || [], ['createdAt']);
    const payments = mapDates(data.payments || [], ['paidAt', 'createdAt', 'updatedAt']);
    const transactions = mapDates(data.transactions || [], ['date', 'createdAt']);
    const settings = mapDates(data.settings || [], ['updatedAt']);
    const activities = mapDates(data.activities || [], ['createdAt']);
    const snapshots = mapDates(data.snapshots || [], ['startedAt', 'completedAt']);

    // 4. Run transactional restore
    await prisma.$transaction(async (tx) => {
      // Clear dependent tables first
      await tx.paymentTransaction.deleteMany();
      await tx.payment.deleteMany();
      await tx.attendanceAuditLog.deleteMany();
      await tx.attendance.deleteMany();
      await tx.student.deleteMany();
      await tx.session.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.monthlyGenerationSnapshot.deleteMany();
      await tx.setting.deleteMany();
      await tx.user.deleteMany();

      // Bulk insert in dependency order
      if (users.length > 0) await tx.user.createMany({ data: users as any });
      if (sessions.length > 0) await tx.session.createMany({ data: sessions as any });
      if (students.length > 0) await tx.student.createMany({ data: students as any });
      if (attendances.length > 0) await tx.attendance.createMany({ data: attendances as any });
      if (auditLogs.length > 0) await tx.attendanceAuditLog.createMany({ data: auditLogs as any });
      if (payments.length > 0) await tx.payment.createMany({ data: payments as any });
      if (transactions.length > 0) await tx.paymentTransaction.createMany({ data: transactions as any });
      if (settings.length > 0) await tx.setting.createMany({ data: settings as any });
      if (activities.length > 0) await tx.activityLog.createMany({ data: activities as any });
      if (snapshots.length > 0) await tx.monthlyGenerationSnapshot.createMany({ data: snapshots as any });
    }, { timeout: 30000 });

    logger.info('Neon PostgreSQL database restored successfully from JSON backup.', 'BackupService');
    return { success: true };
  } catch (error: any) {
    logger.error('Restore database failure', 'BackupService', { error: error.message });
    return { success: false, error: error.message || 'Failed to restore database' };
  }
}

/**
 * Cleans up older backups according to retention policies:
 * - Keep last 7 Daily backups
 * - Keep last 4 Weekly backups
 * - Keep last 5 Manual backups
 */
async function cleanupOldBackups(directory: string) {
  const files = fs.readdirSync(directory);
  const metaFiles = files.filter(f => f.endsWith('-meta.json'));

  const backups: BackupMetadata[] = [];
  for (const metaFile of metaFiles) {
    try {
      const content = fs.readFileSync(path.join(directory, metaFile), 'utf8');
      backups.push(JSON.parse(content));
    } catch {
      // Ignore corrupt metadata
    }
  }

  const cleanByType = (type: 'daily' | 'weekly' | 'manual', retainCount: number) => {
    const typeBackups = backups
      .filter(b => b.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (typeBackups.length > retainCount) {
      const toDelete = typeBackups.slice(retainCount);
      for (const backup of toDelete) {
        const fileToDelete = path.join(directory, backup.filename);
        const metaToDelete = path.join(directory, backup.filename.replace('.json.gz', '-meta.json'));

        if (fs.existsSync(fileToDelete)) fs.unlinkSync(fileToDelete);
        if (fs.existsSync(metaToDelete)) fs.unlinkSync(metaToDelete);
        logger.info(`Retention cleanup deleted old backup: ${backup.filename}`, 'BackupService');
      }
    }
  };

  cleanByType('daily', 7);
  cleanByType('weekly', 4);
  cleanByType('manual', 5);
}

/**
 * Gets a list of all validated backups.
 */
export function getBackupList(): BackupMetadata[] {
  const activeDir = ensureBackupDir();
  if (!fs.existsSync(activeDir)) return [];

  const files = fs.readdirSync(activeDir);
  const metaFiles = files.filter(f => f.endsWith('-meta.json'));

  const list: BackupMetadata[] = [];
  for (const metaFile of metaFiles) {
    try {
      const content = fs.readFileSync(path.join(activeDir, metaFile), 'utf8');
      list.push(JSON.parse(content));
    } catch {
      // Ignore corrupt metadata
    }
  }

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
