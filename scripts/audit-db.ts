import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('============================================================');
  console.log('STEP 1 — Audit the Student');
  console.log('============================================================');

  // Search for student 2390 or Ahmed Hassanein
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { studentId: '2390' },
        { name: { contains: 'حسنين' } },
        { name: { contains: '2390' } }
      ]
    },
    include: { session: true }
  });

  console.log(`Found ${students.length} matching students:`);
  for (const s of students) {
    console.log(`- Student.id (Prisma ID): ${s.id}`);
    console.log(`- Student Number (Excel ID): ${s.studentId}`);
    console.log(`- Student Name: ${s.name}`);
    console.log(`- Monthly Fee: ${s.monthlyFee}`);
    console.log(`- Batch / Session ID: ${s.sessionId}`);
    console.log(`- Session Details: ${s.session ? `${s.session.grade} - Day ${s.session.dayOfWeek} @ ${s.session.time}` : 'No Session'}`);
    console.log(`- Is Archived: ${s.isArchived}`);
    console.log(`- Status: ${s.status}`);
  }

  if (students.length === 0) {
    console.log('No student found with studentId 2390. Fetching top 5 active students for diagnostic:');
    const allStudents = await prisma.student.findMany({ take: 5, include: { session: true } });
    console.log(allStudents);
    return;
  }

  const targetStudent = students[0];

  console.log('\n============================================================');
  console.log('STEP 2 — Audit ALL Payment Records');
  console.log('============================================================');

  const allPayments = await prisma.payment.findMany({
    where: { studentId: targetStudent.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { transactions: true }
  });

  console.log(`Total Payment Rows for student ${targetStudent.name} (${targetStudent.studentId}): ${allPayments.length}`);
  for (const p of allPayments) {
    const remaining = Math.max(0, p.amount - (p.amountPaid || 0));
    console.log(`--- Payment Row ---`);
    console.log(`- Payment ID: ${p.id}`);
    console.log(`- Month: ${p.month}`);
    console.log(`- Year: ${p.year}`);
    console.log(`- Amount: ${p.amount}`);
    console.log(`- AmountPaid: ${p.amountPaid}`);
    console.log(`- Remaining: ${remaining}`);
    console.log(`- Status: ${p.status}`);
    console.log(`- Notes: ${p.notes || 'None'}`);
    console.log(`- Transactions Count: ${p.transactions.length}`);
    console.log(`- CreatedAt: ${p.createdAt.toISOString()}`);
    console.log(`- UpdatedAt: ${p.updatedAt.toISOString()}`);
  }

  console.log('\n============================================================');
  console.log('STEP 3 — Audit the Attendance Session');
  console.log('============================================================');

  const session = targetStudent.sessionId 
    ? await prisma.session.findUnique({ where: { id: targetStudent.sessionId } })
    : await prisma.session.findFirst({ where: { id: 'cms81hmmo0003k104kgy17y3s' } });

  if (session) {
    console.log(`- Session ID: ${session.id}`);
    console.log(`- Session DayOfWeek: ${session.dayOfWeek}`);
    console.log(`- Session Time: ${session.time}`);
    console.log(`- Grade / Batch ID: ${session.grade}`);
    console.log(`- Teacher: ${session.teacherName || 'Default'}`);
  } else {
    console.log('Session not found!');
  }

  console.log('\n============================================================');
  console.log('STEP 8 & 9 — Check All Subscriptions in DB Across All Students');
  console.log('============================================================');

  const totalPaymentsCount = await prisma.payment.count();
  console.log(`Total Payments in DB: ${totalPaymentsCount}`);

  const paymentsByMonth = await prisma.payment.groupBy({
    by: ['month', 'year'],
    _count: { id: true }
  });
  console.log('Payments Grouped by Month/Year in DB:', paymentsByMonth);

  console.log('\n============================================================');
  console.log('STEP 5, 6, 7 — Compare Attendance vs Payments Query Output');
  console.log('============================================================');

  // Query payments for Month 7 and Month 8 specifically for this student
  for (const m of [7, 8]) {
    const y = 2026;
    console.log(`\n>>> Testing Month: ${m}, Year: ${y} <<<`);
    
    // Payments Page Query logic
    const paymentsPageQuery = await prisma.payment.findMany({
      where: {
        month: m,
        year: y,
        studentId: targetStudent.id
      },
      include: { student: true }
    });

    // Attendance Page Query logic
    const attendancePageQuery = await prisma.payment.findMany({
      where: {
        studentId: { in: [targetStudent.id] },
        month: m,
        year: y
      },
      include: { student: true }
    });

    console.log(`Payments Page Query result count for M${m}: ${paymentsPageQuery.length}`);
    if (paymentsPageQuery.length > 0) {
      console.log('Payments Page Record:', {
        id: paymentsPageQuery[0].id,
        studentId: paymentsPageQuery[0].studentId,
        month: paymentsPageQuery[0].month,
        year: paymentsPageQuery[0].year,
        amount: paymentsPageQuery[0].amount,
        amountPaid: paymentsPageQuery[0].amountPaid,
        status: paymentsPageQuery[0].status
      });
    } else {
      console.log('Payments Page Record: NO PAYMENT FOUND');
    }

    console.log(`Attendance Page Query result count for M${m}: ${attendancePageQuery.length}`);
    if (attendancePageQuery.length > 0) {
      console.log('Attendance Page Record:', {
        id: attendancePageQuery[0].id,
        studentId: attendancePageQuery[0].studentId,
        month: attendancePageQuery[0].month,
        year: attendancePageQuery[0].year,
        amount: attendancePageQuery[0].amount,
        amountPaid: attendancePageQuery[0].amountPaid,
        status: attendancePageQuery[0].status
      });
    } else {
      console.log('Attendance Page Record: NO PAYMENT FOUND');
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Audit Script Error:', err);
  process.exit(1);
});
