const fs = require('fs');
const path = require('path');

const srcStatic = path.join(__dirname, '../.next/static');
const destStatic = path.join(__dirname, '../.next/standalone/.next/static');

const srcPublic = path.join(__dirname, '../public');
const destPublic = path.join(__dirname, '../.next/standalone/public');

function copyFolder(src, dest) {
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } else {
    console.warn(`Warning: Source folder ${src} does not exist. Skipping.`);
  }
}

try {
  console.log('Preparing standalone environment...');
  copyFolder(srcStatic, destStatic);
  copyFolder(srcPublic, destPublic);
  console.log('Standalone environment ready.');
} catch (error) {
  console.error('Error preparing standalone environment:', error);
  process.exit(1);
}
