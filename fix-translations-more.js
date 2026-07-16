const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

Object.assign(en.studentProfile, {
  amountToPayNow: "Amount to Pay Now",
  max: "Max",
  eg: "e.g.",
  recordTransaction: "Record Transaction"
});

Object.assign(ar.studentProfile, {
  amountToPayNow: "المبلغ المراد دفعه الآن",
  max: "الحد الأقصى",
  eg: "مثال",
  recordTransaction: "تسجيل المعاملة"
});

Object.assign(en.paymentsPage, {
  generateDues: "Generate Monthly Dues",
  generateDuesDesc: "This will create UNPAID payment records for all active students who don't already have a record for the selected month and year.",
  month: "Month",
  year: "Year",
  generateDuesFor: "Generate Dues for"
});

Object.assign(ar.paymentsPage, {
  generateDues: "إنشاء اشتراكات الشهر",
  generateDuesDesc: "سيؤدي هذا إلى إنشاء سجلات دفع 'غير مدفوعة' لجميع الطلاب النشطين الذين ليس لديهم بالفعل سجل للشهر والسنة المحددين.",
  month: "الشهر",
  year: "السنة",
  generateDuesFor: "إنشاء اشتراكات لـ"
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully added keys');
