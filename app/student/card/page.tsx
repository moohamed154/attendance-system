import { getStudentSession } from '@/lib/student-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// Redirect authenticated student to their personal QR card using the token system
export default async function StudentCardRedirectPage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  // Get the student's DB id and generate token for existing card system
  const student = await prisma.student.findUnique({
    where: { id: session.studentDbId },
    select: { id: true },
  });

  if (!student) redirect('/student/login');

  const { encryptStudentToken } = await import('@/lib/qr/token');
  const token = encryptStudentToken(student.id);

  redirect(`/student/card/${token}`);
}
