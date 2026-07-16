const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'actions', 'attendance.ts');
const contentToAppend = `

export async function getPreviousSessionRecords(sessionId: string, targetDate?: Date) {
  const currentDate = targetDate ? dayjs(targetDate).startOf('day').toDate() : dayjs().startOf('day').toDate();
  
  const prevDateRecord = await prisma.attendance.findFirst({
    where: {
      sessionId,
      date: { lt: currentDate },
      isArchived: false,
    },
    orderBy: { date: 'desc' },
    select: { date: true }
  });

  if (!prevDateRecord) return null;

  const records = await prisma.attendance.findMany({
    where: {
      sessionId,
      date: prevDateRecord.date,
      isArchived: false,
    },
    select: {
      studentId: true,
      status: true,
    }
  });

  const recordsMap = records.reduce((acc, curr) => {
    acc[curr.studentId] = curr.status;
    return acc;
  }, {} as Record<string, AttendanceStatus>);

  return {
    date: prevDateRecord.date,
    records: recordsMap
  };
}
`;

fs.appendFileSync(filePath, contentToAppend);
console.log('Appended getPreviousSessionRecords');
