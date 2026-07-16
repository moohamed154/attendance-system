const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

Object.assign(en.activityPage, {
  totalCount: "(Total: {total})",
  system: "System",
  admin: "Admin",
  assistant: "Assistant",
  actions: {
    "Transaction Recorded": "Transaction Recorded",
    "Student Updated": "Student Updated",
    "USER_LOGIN": "User Login",
    "Attendance Edited": "Attendance Edited",
    "Attendance Recorded": "Attendance Recorded",
    "Payment Recorded": "Payment Recorded",
    "Student Added": "Student Added",
    "Monthly Generation": "Monthly Generation"
  },
  words: {
    "Student:": "Student:",
    "paid": "paid",
    "Total Paid:": "Total Paid:",
    "Status changed to": "Status changed to",
    "for date": "for date",
    "Collected": "Collected",
    "Added successfully": "Added successfully",
    "Generated subscriptions for": "Generated subscriptions for",
    "students": "students",
    "User admin logged in successfully": "User admin logged in successfully"
  }
});

Object.assign(ar.activityPage, {
  totalCount: "(الإجمالي: {total})",
  system: "النظام",
  admin: "مسؤول",
  assistant: "مساعد",
  actions: {
    "Transaction Recorded": "تسجيل معاملة",
    "Student Updated": "تحديث طالب",
    "USER_LOGIN": "تسجيل دخول",
    "Attendance Edited": "تعديل حضور",
    "Attendance Recorded": "تسجيل حضور",
    "Payment Recorded": "تسجيل دفع",
    "Student Added": "إضافة طالب",
    "Monthly Generation": "إنشاء اشتراكات الشهر"
  },
  words: {
    "Student:": "الطالب:",
    "paid": "دفع",
    "Total Paid:": "إجمالي المدفوع:",
    "Status changed to": "تم تغيير الحالة إلى",
    "for date": "لتاريخ",
    "Collected": "تم تحصيل",
    "Added successfully": "تم الإضافة بنجاح",
    "Generated subscriptions for": "تم إنشاء اشتراكات لـ",
    "students": "طلاب",
    "User admin logged in successfully": "تم تسجيل دخول المسؤول بنجاح"
  }
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully added keys');
