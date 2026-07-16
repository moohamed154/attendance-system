const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'ar.json');
const enPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'en.json');

const ar = require(arPath);
const en = require(enPath);

ar.reportsPage.exportExcel = "تصدير إلى إكسيل";
ar.reportsPage.exportPdf = "تصدير إلى PDF";

en.reportsPage.exportExcel = "Export to Excel";
en.reportsPage.exportPdf = "Export to PDF";

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Added export button text to dictionaries.');
