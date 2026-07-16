import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

const ARABIC_FIRST_NAMES_MALE = ['أحمد', 'محمد', 'عمر', 'يوسف', 'مصطفى', 'محمود', 'كريم', 'عمرو', 'علي', 'زياد', 'عبدالرحمن', 'إبراهيم', 'حسن', 'حسين', 'طارق', 'ماجد', 'سيف', 'ياسين', 'مازن'];
const ARABIC_FIRST_NAMES_FEMALE = ['سارة', 'مريم', 'آية', 'ملك', 'جنى', 'فرح', 'سلمى', 'نور', 'حبيبة', 'هنا', 'ليلى', 'يارا', 'نهى', 'منى', 'دينا', 'رنا', 'ريم', 'ندى', 'مي', 'منة'];
const ARABIC_LAST_NAMES = ['حسن', 'إبراهيم', 'علي', 'عبدالعزيز', 'محمود', 'السيد', 'عثمان', 'جابر', 'فتحي', 'توفيق', 'منصور', 'سالم', 'سليمان', 'كمال', 'سعيد', 'يونس', 'فؤاد', 'غزال'];

const SESSIONS_CONFIG = [
  { grade: 'الصف الثالث الإعدادي', sessions: [{ dayOfWeek: 6, time: '16:00' }, { dayOfWeek: 2, time: '16:00' }] }, // Sat, Tue
  { grade: 'الصف الأول الثانوي', sessions: [{ dayOfWeek: 0, time: '17:30' }, { dayOfWeek: 3, time: '17:30' }] },   // Sun, Wed
  { grade: 'الصف الثاني الثانوي', sessions: [{ dayOfWeek: 6, time: '19:00' }, { dayOfWeek: 2, time: '19:00' }] },  // Sat, Tue
  { grade: 'الصف الثالث الثانوي', sessions: [{ dayOfWeek: 0, time: '20:30' }, { dayOfWeek: 3, time: '20:30' }] },   // Sun, Wed
];

const generatePhone = () => `01${Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 90000000 + 10000000)}`;

const getRandomName = () => {
  const isMale = Math.random() > 0.5;
  const first = isMale ? ARABIC_FIRST_NAMES_MALE[Math.floor(Math.random() * ARABIC_FIRST_NAMES_MALE.length)] : ARABIC_FIRST_NAMES_FEMALE[Math.floor(Math.random() * ARABIC_FIRST_NAMES_FEMALE.length)];
  const second = ARABIC_LAST_NAMES[Math.floor(Math.random() * ARABIC_LAST_NAMES.length)];
  const third = ARABIC_LAST_NAMES[Math.floor(Math.random() * ARABIC_LAST_NAMES.length)];
  return `${first} ${second} ${third}`;
};

async function main() {
  console.log('Ensuring admin user exists...');
  const bcrypt = await import('bcrypt');
  const adminPassword = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Clearing database...');
  
  await prisma.activityLog.deleteMany({});
  await prisma.attendanceAuditLog.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.session.deleteMany({});

  console.log('Creating Sessions...');
  const createdSessions: any[] = [];
  for (const config of SESSIONS_CONFIG) {
    for (const session of config.sessions) {
      const s = await prisma.session.create({
        data: {
          grade: config.grade,
          dayOfWeek: session.dayOfWeek,
          time: session.time,
        }
      });
      createdSessions.push(s);
    }
  }

  console.log('Generating Students...');
  let excelId = 1001;
  const generateStudent = async (type: 'ACTIVE' | 'ARCHIVED' | 'FROZEN' | 'TRANSFERRED' | 'NEW', sessionIndex?: number) => {
    const session = sessionIndex !== undefined ? createdSessions[sessionIndex] : createdSessions[Math.floor(Math.random() * createdSessions.length)];
    const monthlyFee = session.grade.includes('الثالث الثانوي') ? 400 : (session.grade.includes('الثانوي') ? 300 : 200);

    return await prisma.student.create({
      data: {
        studentId: `${excelId++}`,
        name: getRandomName(),
        grade: session.grade,
        sessionId: session.id,
        monthlyFee,
        studentPhone: generatePhone(),
        parentPhone: generatePhone(),
        status: type === 'ACTIVE' || type === 'NEW' ? 'ACTIVE' : type,
        isArchived: type === 'ARCHIVED',
        notes: type === 'TRANSFERRED' ? 'Transferred to another center.' : undefined,
        createdAt: type === 'NEW' ? new Date() : dayjs().subtract(7, 'months').toDate(),
      }
    });
  };

  const students: any[] = [];

  // Active Students
  for (let i = 0; i < 150; i++) {
    students.push(await generateStudent('ACTIVE'));
  }

  // Edge Cases
  const archivedStudents: any[] = [];
  for (let i = 0; i < 11; i++) archivedStudents.push(await generateStudent('ARCHIVED'));

  const frozenStudents: any[] = [];
  for (let i = 0; i < 5; i++) frozenStudents.push(await generateStudent('FROZEN'));

  const transferredStudents: any[] = [];
  for (let i = 0; i < 3; i++) transferredStudents.push(await generateStudent('TRANSFERRED'));

  const newStudents: any[] = [];
  for (let i = 0; i < 5; i++) newStudents.push(await generateStudent('NEW'));

  console.log('Generating Historical Data (Payments & Attendance)...');
  const allHistoricalStudents = [...students, ...archivedStudents, ...frozenStudents, ...transferredStudents];

  const now = dayjs();
  const attendancesData: any[] = [];
  const paymentsData: any[] = [];
  const transactionsData: any[] = [];
  
  for (const student of allHistoricalStudents) {
    // Generate payments for last 6 months
    for (let m = 5; m >= 0; m--) {
      const monthDate = now.subtract(m, 'month');
      
      // Stop generating for specific types
      if (student.status === 'TRANSFERRED' && m < 2) continue; // transferred 2 months ago
      if (student.status === 'FROZEN' && m < 1) continue; // frozen 1 month ago
      if (student.isArchived && m < 3) continue; // archived 3 months ago
      
      const rand = Math.random();
      let status = 'PAID';
      let amountPaid = student.monthlyFee!;
      
      if (rand > 0.85) { status = 'UNPAID'; amountPaid = 0; }
      else if (rand > 0.75) { status = 'PARTIAL'; amountPaid = amountPaid / 2; }

      const paymentId = `pay_${student.id}_${m}`;

      paymentsData.push({
        id: paymentId,
        studentId: student.id,
        month: monthDate.month() + 1,
        year: monthDate.year(),
        amount: student.monthlyFee!,
        amountPaid,
        status: status as 'PAID' | 'UNPAID' | 'PARTIAL',
        paidAt: status !== 'UNPAID' ? monthDate.date(5).toDate() : null,
        createdAt: monthDate.date(1).toDate(),
        updatedAt: monthDate.date(1).toDate(),
      });

      if (status !== 'UNPAID') {
        transactionsData.push({
          id: `tx_${paymentId}`,
          paymentId: paymentId,
          amount: amountPaid,
          date: monthDate.date(5).toDate(),
          paymentMethod: 'Cash',
          createdAt: monthDate.date(5).toDate(),
        });
      }
    }

    // Generate attendance for last 3 months
    const session = createdSessions.find(s => s.id === student.sessionId);
    if (!session) continue;

    for (let d = 90; d >= 0; d--) {
      const date = now.subtract(d, 'days');
      
      // Stop generating
      if (student.status === 'TRANSFERRED' && d < 60) continue; 
      if (student.status === 'FROZEN' && d < 30) continue; 
      if (student.isArchived && d < 90) continue; 

      if (date.day() === session.dayOfWeek) {
        const rand = Math.random();
        let attStatus = 'PRESENT';
        if (rand > 0.9) attStatus = 'ABSENT';
        else if (rand > 0.85) attStatus = 'LATE';

        attendancesData.push({
          studentId: student.id,
          sessionId: session.id,
          date: date.startOf('day').toDate(),
          status: attStatus as 'PRESENT' | 'ABSENT' | 'LATE',
          createdAt: date.hour(parseInt(session.time.split(':')[0])).toDate(),
          updatedAt: date.hour(parseInt(session.time.split(':')[0])).toDate(),
          isArchived: student.isArchived
        });
      }
    }
  }

  // Insert payments
  const chunkSize = 500;
  console.log(`Inserting ${paymentsData.length} payment records...`);
  for (let i = 0; i < paymentsData.length; i += chunkSize) {
    await prisma.payment.createMany({
      data: paymentsData.slice(i, i + chunkSize)
    });
  }

  // Insert transactions
  console.log(`Inserting ${transactionsData.length} payment transaction records...`);
  for (let i = 0; i < transactionsData.length; i += chunkSize) {
    await prisma.paymentTransaction.createMany({
      data: transactionsData.slice(i, i + chunkSize)
    });
  }

  // Insert attendances in chunks to prevent SQLite I/O errors
  console.log(`Inserting ${attendancesData.length} attendance records...`);
  for (let i = 0; i < attendancesData.length; i += chunkSize) {
    await prisma.attendance.createMany({
      data: attendancesData.slice(i, i + chunkSize)
    });
  }

  console.log('Generating Activity Logs...');
  await prisma.activityLog.createMany({
    data: [
      { action: 'Student Added', target: 'Ahmed Hassan', description: 'Added successfully', createdAt: now.subtract(1, 'day').toDate() },
      { action: 'Payment Recorded', target: '1001', description: 'Collected 200 EGP', createdAt: now.subtract(2, 'hours').toDate() },
      { action: 'Monthly Generation', target: 'September 2026', description: 'Generated subscriptions for 145 students', createdAt: now.subtract(5, 'days').toDate() }
    ]
  });

  console.log('Demo database generated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
