import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('============================================================');
  console.log('DATABASE AUDIT: Searching for Student & Payments');
  console.log('============================================================');

  // 1. Fetch Student 2390
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { studentId: '2390' },
        { name: { contains: 'حسنين' } }
      ]
    },
    include: { session: true }
  });

  if (!student) {
    console.log('Student not found in DB!');
    return;
  }

  console.log('STUDENT RECORD:');
  console.log({
    'student.id (Prisma CUID)': student.id,
    'student.studentId (Excel ID)': student.studentId,
    'student.name': student.name,
    'student.grade': student.grade,
    'student.monthlyFee': student.monthlyFee,
    'student.sessionId': student.sessionId,
    'student.isArchived': student.isArchived,
    'student.status': student.status
  });

  // 2. Fetch ALL Payments for this student across ALL months
  const allStudentPayments = await prisma.payment.findMany({
    where: { studentId: student.id }
  });

  console.log(`\nALL PAYMENT ROWS FOR STUDENT ${student.name} (${student.id}):`);
  console.log(allStudentPayments);

  // 3. Fetch ALL Payments for Month 8 (August 2026) across ALL students in DB
  const allMonth8Payments = await prisma.payment.findMany({
    where: { month: 8, year: 2026 },
    include: { student: true }
  });

  console.log(`\nTOTAL PAYMENT ROWS IN DB FOR MONTH 8 (AUGUST 2026): ${allMonth8Payments.length}`);
  allMonth8Payments.forEach(p => {
    console.log(`- Payment ID: ${p.id} | studentId (FK): ${p.studentId} | Excel ID: ${p.student?.studentId} | Name: ${p.student?.name} | Amount: ${p.amount} | Paid: ${p.amountPaid} | Status: ${p.status}`);
  });

  // 4. Test getStudentPaymentForMonth
  console.log('\n============================================================');
  console.log('TESTING getStudentPaymentForMonth(studentId, 8, 2026)');
  console.log('============================================================');

  const month8PaymentByPrismaId = await prisma.payment.findUnique({
    where: {
      studentId_month_year: {
        studentId: student.id,
        month: 8,
        year: 2026
      }
    }
  });

  console.log('Query by Prisma CUID (student.id):', month8PaymentByPrismaId);

  // Check if a payment exists under Excel ID string "2390" instead of Prisma CUID!
  const month8PaymentByExcelId = await prisma.payment.findMany({
    where: {
      studentId: student.studentId, // "2390"
      month: 8,
      year: 2026
    }
  });

  console.log('Query by Excel ID ("2390"):', month8PaymentByExcelId);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error running audit script:', err);
  process.exit(1);
});
