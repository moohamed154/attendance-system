import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authSession = await getSession();
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ students: [] });
    }

    const students = await prisma.student.findMany({
      where: {
        isArchived: false,
        OR: [
          { name: { contains: query } },
          { studentId: { contains: query } },
          { studentPhone: { contains: query } },
          { parentPhone: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        studentId: true,
        grade: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
