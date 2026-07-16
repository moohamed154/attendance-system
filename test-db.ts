import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = Date.now();
  const students = await prisma.student.findMany({
    take: 1000,
    include: { session: true }
  });
  const duration = Date.now() - start;
  console.log(`Fetched ${students.length} students in ${duration}ms`);
}

main().finally(() => prisma.$disconnect());
