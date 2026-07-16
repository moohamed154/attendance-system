const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'lib', 'i18n', 'dictionaries', 'ar.json');
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

ar.studentProfile = {
  "remaining": "المتبقي",
  "monthlyFee": "المصروف الشهري",
  "noAttendance": "لا توجد سجلات حضور",
  "totalSessions": "إجمالي الحصص",
  "day": "اليوم",
  "month": "الشهر",
  "financialSummary": "الملخص المالي",
  "noTransactions": "لا توجد معاملات دفع.",
  "present": "حاضر",
  "status": "الحالة",
  "title": "ملف الطالب وسجلاته",
  "lastUpdated": "آخر تحديث",
  "totalExpected": "الإجمالي المتوقع",
  "subscription": "اشتراك",
  "due": "المستحق",
  "subscriptionDues": "الاشتراكات المستحقة",
  "paid": "المدفوع",
  "late": "متأخر",
  "amountPaid": "المبلغ المدفوع",
  "time": "الوقت",
  "createdDate": "تاريخ الإنشاء",
  "currentMonthSubscription": "اشتراك الشهر الحالي",
  "attendancePercentage": "نسبة الحضور %",
  "noSubscription": "لم يتم إنشاء اشتراك لشهر",
  "studentType": "نوع الطالب",
  "internalId": "المعرف الداخلي",
  "receipt": "الإيصال",
  "amount": "المبلغ",
  "openAttendancePage": "فتح صفحة الحضور",
  "noSubscriptions": "لا توجد اشتراكات مسجلة",
  "grade": "الصف الدراسي",
  "absent": "غائب",
  "collectionPercentage": "نسبة التحصيل %",
  "excelId": "معرف الإكسيل",
  "information": "المعلومات الأساسية",
  "quickActions": "إجراءات سريعة",
  "session": "المجموعة",
  "date": "التاريخ",
  "paymentTimeline": "سجل المدفوعات",
  "currentMonth": "الشهر الحالي",
  "managePayments": "إدارة المدفوعات",
  "recentAttendance": "الحضور الحديث",
  "attendanceStats": "إحصائيات الحضور",
  "notes": "ملاحظات",
  "noSession": "بدون مجموعة",
  "paymentFor": "دفع لاشتراك",
  "totalPaid": "إجمالي المدفوع",
  "daysArray": [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت"
  ],
  "yet": "بعد.",
  "startNewMonth": "بدء شهر جديد"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('Successfully fully restored Arabic translations for studentProfile.');
