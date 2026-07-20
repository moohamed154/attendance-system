import { getDictionary } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { decryptStudentToken } from '@/lib/qr/token';
import { notFound, redirect } from 'next/navigation';
import { StudentCard } from '@/components/student/StudentCard';
import { getCenterSettings } from '@/actions/settings';

export default async function StudentCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dict = await getDictionary();
  const { centerName, teacherName } = await getCenterSettings();

  // Decrypt token to get student CUID
  const studentCuid = decryptStudentToken(decodeURIComponent(token));
  if (!studentCuid) {
    redirect('/student');
  }

  // Fetch student info
  const student = await prisma.student.findUnique({
    where: {
      id: studentCuid,
      isArchived: false,
    },
    select: {
      id: true,
      studentId: true,
      name: true,
      grade: true,
      studentPhone: true,
      status: true,
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <StudentCard student={student} dict={dict} centerName={centerName} teacherName={teacherName} />
    </div>
  );
}
