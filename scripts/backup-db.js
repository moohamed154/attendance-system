const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

console.log(`Starting PostgreSQL database backup to ${backupFile}...`);
try {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  // Execute pg_dump if available in environment
  execSync(`pg_dump "${dbUrl}" -F p -f "${backupFile}"`, { stdio: 'inherit' });
  console.log(`Backup completed successfully: ${backupFile}`);
} catch (err) {
  console.warn(`pg_dump skipped or failed: ${err.message}. Ensure pg_dump is installed for automated local dumps.`);
}
