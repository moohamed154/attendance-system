const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'en.json');
const arPath = path.join(__dirname, '..', 'lib', 'i18n', 'dictionaries', 'ar.json');

const en = require(enPath);
const ar = require(arPath);

en.attendanceInsights = {
  summaryTitle: "Session Summary",
  totalStudents: "Total Students",
  present: "Present",
  absent: "Absent",
  late: "Late",
  attendanceRate: "Attendance Rate",
  returnedAfterAbsence: "Returned After Absence",
  newlyAbsent: "Absent After Previous Attendance",
  previousSessionComparison: "Previous Session Comparison",
  currentSession: "Current Session",
  previousSession: "Previous Session",
  noPreviousAttendance: "No previous attendance available.",
  studentName: "Student Name",
  studentId: "Student ID",
  previousDate: "Previous Date",
  currentStatus: "Current Status"
};

ar.attendanceInsights = {
  summaryTitle: "ملخص الجلسة",
  totalStudents: "إجمالي الطلاب",
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  attendanceRate: "نسبة الحضور",
  returnedAfterAbsence: "عادوا بعد غياب",
  newlyAbsent: "غابوا بعد حضور",
  previousSessionComparison: "مقارنة بالجلسة السابقة",
  currentSession: "الجلسة الحالية",
  previousSession: "الجلسة السابقة",
  noPreviousAttendance: "لا يتوفر سجل حضور سابق.",
  studentName: "اسم الطالب",
  studentId: "رقم الطالب",
  previousDate: "التاريخ السابق",
  currentStatus: "الحالة الحالية"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log('Localization updated');
