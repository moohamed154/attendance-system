const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

Object.assign(en.studentProfile, {
  pay: "Pay",
  recordPaymentTitle: "Record Payment",
  recordPaymentDesc: "Record a partial or full payment for",
  totalFee: "Total Fee",
  alreadyPaid: "Already Paid",
  recordAttendance: "Record Today's Attendance",
  recordAttendanceTitle: "Today's Attendance",
  recordAttendanceDesc: "Record attendance for",
  noSessionAssigned: "This student must be assigned to a session before taking attendance.",
  forTodaySession: "for today's session."
});

Object.assign(ar.studentProfile, {
  pay: "دفع",
  recordPaymentTitle: "تسجيل الدفع",
  recordPaymentDesc: "تسجيل دفعة جزئية أو كاملة لـ",
  totalFee: "إجمالي المصروف",
  alreadyPaid: "تم دفعه مسبقاً",
  recordAttendance: "تسجيل حضور اليوم",
  recordAttendanceTitle: "حضور اليوم",
  recordAttendanceDesc: "تسجيل حضور لـ",
  noSessionAssigned: "يجب تعيين هذا الطالب لمجموعة قبل تسجيل الحضور.",
  forTodaySession: "لحصة اليوم."
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully updated en.json and ar.json');
