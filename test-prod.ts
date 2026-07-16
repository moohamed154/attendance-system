import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
});
async function main() {
  try {
    const id = "cmrn92rts007we4s4ftlxqe0a";
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        session: true,
        attendances: { include: { session: true }, orderBy: { date: 'desc' } },
        payments: { include: { transactions: { orderBy: { date: 'desc' } } }, orderBy: [ { year: 'desc' }, { month: 'desc' } ] }
      }
    });
    console.log(JSON.stringify(student, null, 2));
  } catch (e) {
    console.error("PRISMA ERROR:", e);
  }
}
main().finally(() => prisma.$disconnect());
