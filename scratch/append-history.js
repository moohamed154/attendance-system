const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'actions', 'attendance.ts');
const appendContent = `
export async function getAllHistoricalRecords(
  date?: string, 
  grade?: string, 
  sessionId?: string, 
  status?: string, 
  query?: string,
  skip: number = 0,
  take: number = 50
) {
  const where: any = { isArchived: false };
  
  if (date) {
    const targetDate = dayjs(date).startOf('day').toDate();
    const endDate = dayjs(date).add(1, 'day').startOf('day').toDate();
    where.date = {
      gte: targetDate,
      lt: endDate
    };
  }
  
  if (sessionId && sessionId !== 'all') {
    where.sessionId = sessionId;
  }
  
  if (grade && grade !== 'all') {
    where.session = { grade };
  }
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (query) {
    where.student = {
      ...where.student,
      OR: [
        { name: { contains: query } },
        { studentId: { contains: query } }
      ]
    };
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        session: true,
        student: true,
        auditLogs: {
          include: { editedBy: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take
    })
  ]);

  return { total, records };
}
`;

fs.appendFileSync(filePath, appendContent);
console.log('Appended to attendance.ts');
