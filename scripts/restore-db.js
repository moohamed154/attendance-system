const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupFile = process.argv[2];

if (!backupFile || !fs.existsSync(backupFile)) {
  console.error('Usage: node scripts/restore-db.js <path-to-backup-file.sql>');
  process.exit(1);
}

console.log(`Restoring database from ${backupFile}...`);
try {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  execSync(`psql "${dbUrl}" -f "${backupFile}"`, { stdio: 'inherit' });
  console.log('Database restored successfully.');
} catch (err) {
  console.error(`Database restore error: ${err.message}`);
  process.exit(1);
}
