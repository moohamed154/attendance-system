const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Stress Testing Start New Month Generation...');

  // 1. Get a session to use
  let session = await prisma.session.findFirst();
  if (!session) {
    session = await prisma.session.create({
      data: {
        dayOfWeek: 1,
        time: '18:00',
        grade: 'Test Grade'
      }
    });
  }

  // 2. Insert 1000 active students
  console.log('Inserting 1000 students...');
  const studentsToInsert = [];
  for (let i = 0; i < 1000; i++) {
    studentsToInsert.push({
      name: \Stress Test Student \\,
      studentId: \STRESS-\-\\,
      grade: 'Test Grade',
      monthlyFee: 500,
      sessionId: session.id,
      status: 'ACTIVE',
      teacherName: 'Stress Tester'
    });
  }

  await prisma.student.createMany({
    data: studentsToInsert,
    skipDuplicates: true
  });
  console.log('Inserted 1000 students.');

  // 3. Test Preview
  const { getNewMonthPreview, generateNewMonthChunk, lockGeneration, finalizeNewMonthGeneration } = require('../actions/subscriptions');
  // Need to mock getAuthSession for the actions
  // Since we are running in a script, Next.js 'server actions' context won't work well if they rely on cookies.
  console.log('Stress test script complete. Data seeded for UI testing.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.();
  });
