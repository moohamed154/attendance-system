const fs = require('fs');
const path = require('path');

const enPath = path.join('E:', 'attendance-system', 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join('E:', 'attendance-system', 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

en.reportsPage.mostAbsentTitle = "Most Absent (Selected Period)";
en.reportsPage.bestAttendanceTitle = "Best Attendance (Selected Period)";
en.reportsPage.pendingInPeriodTitle = "Pending in Period";
en.reportsPage.fromUnpaidTransactions = "from {count} unpaid transaction";
en.reportsPage.fromUnpaidTransactionsPlural = "from {count} unpaid transactions";

ar.reportsPage.mostAbsentTitle = "الأكثر غياباً (خلال الفترة)";
ar.reportsPage.bestAttendanceTitle = "أفضل حضور (خلال الفترة)";
ar.reportsPage.pendingInPeriodTitle = "المعلق في الفترة";
ar.reportsPage.fromUnpaidTransactions = "من {count} معاملة غير مدفوعة";
ar.reportsPage.fromUnpaidTransactionsPlural = "من {count} معاملات غير مدفوعة";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
