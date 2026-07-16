import { prisma } from './lib/prisma';
async function test() {
  const res = await prisma.attendance.groupBy({
    by: ['date'],
    where: { sessionId: 'cmrn92io00006e4s4gqp8m97g' },
    orderBy: { date: 'desc' }
  });
  console.log(res);
}
test();
