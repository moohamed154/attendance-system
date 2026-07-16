import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});
async function main() {
  try {
    const student = await prisma.student.findFirst({
      include: {
        session: true,
        attendances: { include: { session: true } },
        payments: { include: { transactions: true } }
      }
    });
    console.log("Found student:", student?.id);
    if (student) {
        console.log("Payments count:", student.payments.length);
        console.log("Transactions count:", student.payments.flatMap(p => p.transactions).length);
        
        // Let's test the map
        const allTransactions = student.payments.flatMap((p: any) => 
            p.transactions.map((t: any) => ({
                ...t,
                month: p.month,
                year: p.year,
                paymentAmount: p.amount,
            }))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log("All transactions mapped successfully!");
    }
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => prisma.$disconnect());
