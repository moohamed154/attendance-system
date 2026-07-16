const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

Object.assign(en.paymentsPage, {
  pageTitle: "Monthly Payment Center",
  pageSubtitle: "Manage subscriptions and partial payments.",
  expectedRevenue: "Expected Revenue",
  studentsCount: "{count} Students",
  collected: "Collected",
  collectionRate: "{rate}% Collection Rate",
  remaining: "Remaining",
  partialAndUnpaid: "{partial} Partial, {unpaid} Unpaid",
  fullyPaidStudents: "Fully Paid Students",
  outOfTotal: "out of {total}",
  noSubscriptionsMonth: "No subscriptions found for this month.",
  fullyPaid: "Fully Paid",
  partiallyPaid: "Partially Paid",
  unpaidStatus: "Unpaid"
});
Object.assign(en.paymentsPage.columns, {
  grade: "Grade",
  monthlyFee: "Monthly Fee",
  totalPaid: "Total Paid",
  remaining: "Remaining",
  lastPayment: "Last Payment",
  transactions: "Transactions"
});

Object.assign(ar.paymentsPage, {
  pageTitle: "مركز الدفع الشهري",
  pageSubtitle: "إدارة الاشتراكات والدفعات الجزئية.",
  expectedRevenue: "الإيرادات المتوقعة",
  studentsCount: "{count} طلاب",
  collected: "المُحصّل",
  collectionRate: "نسبة التحصيل {rate}%",
  remaining: "المتبقي",
  partialAndUnpaid: "{partial} جزئي، {unpaid} غير مدفوع",
  fullyPaidStudents: "الطلاب المسددين بالكامل",
  outOfTotal: "من أصل {total}",
  noSubscriptionsMonth: "لم يتم العثور على اشتراكات لهذا الشهر.",
  fullyPaid: "مسدد بالكامل",
  partiallyPaid: "مسدد جزئياً",
  unpaidStatus: "غير مسدد"
});
Object.assign(ar.paymentsPage.columns, {
  grade: "الصف",
  monthlyFee: "رسوم الشهر",
  totalPaid: "إجمالي المدفوع",
  remaining: "المتبقي",
  lastPayment: "آخر دفعة",
  transactions: "المعاملات"
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully added keys');
