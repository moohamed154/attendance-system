import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupTestData(testId: string) {
  // Delete all data associated with a specific test run ID
  await prisma.attendance.deleteMany({
    where: { student: { name: { contains: testId } } },
  });
  await prisma.payment.deleteMany({
    where: { student: { name: { contains: testId } } },
  });
  await prisma.student.deleteMany({
    where: { name: { contains: testId } },
  });
  await prisma.session.deleteMany({
    where: { grade: { contains: testId } },
  });
}

export { prisma };
