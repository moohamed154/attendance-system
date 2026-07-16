'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export async function logActivity(
  action: string,
  target: string,
  description?: string
) {
  try {
    const session = await getSession();
    if (!session) return;

    await prisma.activityLog.create({
      data: {
        action,
        userId: session.id as string,
        role: session.role as string,
        target,
        description,
      },
    });
  } catch (error) {
    logger.error('Failed to log activity', 'logActivity', { error: String(error) });
  }
}

type ActivityLogWhereInput = Prisma.ActivityLogWhereInput;

export async function getActivities(q?: string, roleFilter?: string, skip?: number, take?: number) {
  const where: ActivityLogWhereInput = {};

  if (q) {
    where.OR = [
      { action: { contains: q } },
      { target: { contains: q } },
      { description: { contains: q } },
      { user: { username: { contains: q } } },
    ];
  }

  if (roleFilter && roleFilter !== 'all') {
    where.role = roleFilter;
  }

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
          }
        }
      },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined ? { take } : { take: 100 }),
    }),
    prisma.activityLog.count({ where })
  ]);

  return { data, total };
}
