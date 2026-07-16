import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
});
async function main() {
  const student = await prisma.student.findUnique({
    where: { id: "cmrn92rts007we4s4ftlxqe0a" }
  });
  console.log("STUDENT ROOT:", JSON.stringify(student, null, 2));
}
main().finally(() => prisma.$disconnect());
