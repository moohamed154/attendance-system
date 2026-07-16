const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Finding duplicate payments...');
  
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  const seen = new Set();
  let duplicates = 0;
  
  for (const payment of payments) {
    const key = `${payment.studentId}-${payment.month}-${payment.year}`;
    if (seen.has(key)) {
      console.log(`Deleting duplicate payment ${payment.id} for ${key}`);
      await prisma.payment.delete({ where: { id: payment.id } });
      duplicates++;
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Deleted ${duplicates} duplicate payments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
