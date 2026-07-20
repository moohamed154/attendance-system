import { prisma } from '@/lib/prisma';
import { getDictionary } from '@/lib/i18n';
import { getCenterSettings } from '@/actions/settings/settings';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrintCardsClient } from './PrintCardsClient';

export default async function PrintCardsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const students = await prisma.student.findMany({
    where: { isArchived: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      studentId: true,
      name: true,
      grade: true,
      studentPhone: true,
      status: true,
    }
  });

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort() as string[];
  const dict = await getDictionary();
  const { centerName, teacherName } = await getCenterSettings();

  return (
    <PrintCardsClient 
      students={students} 
      uniqueGrades={uniqueGrades} 
      dict={dict} 
      centerName={centerName} 
      teacherName={teacherName} 
    />
  );
}
