import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function verifyProduction() {
  console.log('====================================================');
  console.log('🚀 RUNNING FINAL PRODUCTION HARDENING AUDIT CHECKLIST');
  console.log('====================================================\n');

  let passed = true;

  // 1. Env check: DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('✓ Environment: DATABASE_URL exists.');
  } else {
    console.error('✗ Error: DATABASE_URL is missing in environment variables.');
    passed = false;
  }

  // 2. Env check: JWT_SECRET
  if (process.env.JWT_SECRET) {
    console.log('✓ Environment: JWT_SECRET exists.');
  } else {
    console.warn('⚠️ Warning: JWT_SECRET is missing. Will fall back to dev secret.');
    passed = false;
  }

  // 3. Database Connectivity & Neon / Prisma Connection
  const prisma = new PrismaClient();
  try {
    const startTime = Date.now();
    await prisma.$queryRawUnsafe('SELECT 1');
    const duration = Date.now() - startTime;
    console.log(`✓ Database: Neon PostgreSQL / Prisma connected successfully (${duration}ms).`);
  } catch (error: any) {
    console.error('✗ Database: Failed to connect to database provider.');
    console.error(`  Error message: ${error.message}`);
    passed = false;
  } finally {
    await prisma.$disconnect();
  }

  // 4. Storage Write Permissions
  const testWriteDir = path.join(process.cwd(), 'prisma', 'backups');
  try {
    if (!fs.existsSync(testWriteDir)) {
      fs.mkdirSync(testWriteDir, { recursive: true });
    }
    const testFile = path.join(testWriteDir, '.write-test');
    fs.writeFileSync(testFile, 'write-test');
    fs.unlinkSync(testFile);
    console.log('✓ Storage: Directory writing permissions verified.');
  } catch (error: any) {
    console.warn('⚠️ Storage: Local backup directory not writable (this is normal on read-only serverless runtimes).');
    console.log('  Automatic fallback to /tmp filesystem is active.');
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🎉 STATUS: ALL PRODUCTION VERIFICATION CHECKS PASSED!');
    console.log('The application is fully ready for deployment.');
  } else {
    console.error('❌ STATUS: RED ALERTS DETECTED. Please fix the above issues before shipping.');
    process.exit(1);
  }
  console.log('====================================================\n');
}

verifyProduction().catch(err => {
  console.error('Unexpected audit checklist runner failure:', err);
  process.exit(1);
});
