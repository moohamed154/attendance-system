const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

en.studentProfile.startNewMonth = "Start New Month";
ar.studentProfile.startNewMonth = "بدء شهر جديد";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully updated startNewMonth in en.json and ar.json');
