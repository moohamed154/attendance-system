const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'ar.json');
const enPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'en.json');

const ar = require(arPath);
const en = require(enPath);

if (!ar.reportsPage.export) {
  ar.reportsPage.export = {
    egp: "ج.م",
    attendanceSheet: "الحضور",
    month: "الشهر",
    collected: "محصل",
    pending: "قيد الانتظار",
    paymentsSheet: "المدفوعات",
    attendancePdfTitle: "تقرير الحضور",
    paymentsPdfTitle: "تقرير المدفوعات",
    date: "التاريخ",
    present: "حاضر",
    absent: "غائب",
    late: "متأخر"
  };
}

if (!en.reportsPage.export) {
  en.reportsPage.export = {
    egp: "EGP",
    attendanceSheet: "Attendance",
    month: "Month",
    collected: "Collected",
    pending: "Pending",
    paymentsSheet: "Payments",
    attendancePdfTitle: "Attendance Report",
    paymentsPdfTitle: "Payments Report",
    date: "Date",
    present: "Present",
    absent: "Absent",
    late: "Late"
  };
}

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Dictionaries updated successfully.');
