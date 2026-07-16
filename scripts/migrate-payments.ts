import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const students = await prisma.student.findMany();
  console.log(`Found ${students.length} students. Migrating payments for ${currentMonth}/${currentYear}...`);

  let created = 0;
  let updated = 0;

  for (const student of students) {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: student.id,
        month: currentMonth,
        year: currentYear,
      }
    });

    const isPaid = student.monthlyFee !== null && !isNaN(student.monthlyFee);

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: student.monthlyFee || 0,
          status: isPaid ? 'PAID' : 'UNPAID',
          paidAt: isPaid && existingPayment.status !== 'PAID' ? new Date() : existingPayment.paidAt,
        }
      });
      updated++;
    } else {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          amount: student.monthlyFee || 0,
          month: currentMonth,
          year: currentYear,
          status: isPaid ? 'PAID' : 'UNPAID',
          paidAt: isPaid ? new Date() : null,
        }
      });
      created++;
    }
  }

  console.log(`Migration complete. Created ${created} payments, updated ${updated} payments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
