const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'ar.json');
const enPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'en.json');

const ar = require(arPath);
const en = require(enPath);

if (!ar.reportsPage.attendanceChart) {
  ar.reportsPage.attendanceChart = {
    title: "سجل الحضور",
    subtitle: "إحصائيات الحضور للفترة المحددة",
    present: "حاضر",
    late: "متأخر",
    absent: "غائب"
  };
}

if (!ar.reportsPage.paymentsChart) {
  ar.reportsPage.paymentsChart = {
    title: "سجل المدفوعات",
    subtitle: "الإيرادات المحصلة للفترة المحددة",
    collected: "محصل",
    pending: "غير مدفوع"
  };
}

if (!en.reportsPage.attendanceChart) {
  en.reportsPage.attendanceChart = {
    title: "Attendance Record",
    subtitle: "Attendance statistics for the selected period",
    present: "Present",
    late: "Late",
    absent: "Absent"
  };
}

if (!en.reportsPage.paymentsChart) {
  en.reportsPage.paymentsChart = {
    title: "Payments Record",
    subtitle: "Collected revenue for the selected period",
    collected: "Collected",
    pending: "Pending"
  };
}

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Dictionaries updated successfully for charts.');
