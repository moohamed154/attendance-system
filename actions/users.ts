'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { Role } from '@prisma/client';

// Ensure the caller is an ADMIN
async function verifyAdmin() {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getUsers(query?: string, role?: string) {
  await verifyAdmin();
  
  const where: any = {};
  if (query) {
    where.username = { contains: query };
  }
  if (role && role !== 'all') {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
  return users;
}

export async function addUser(data: { username: string; password: string; role: Role }) {
  try {
    const session = await verifyAdmin();

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUser) {
      return { error: 'Username already exists' };
    }

    if (data.password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
      }
    });

    await logActivity('CREATE_USER', `User: ${newUser.username}`, `Role: ${newUser.role}`);

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    console.error('Add user error:', error);
    return { error: error.message || 'Failed to add user' };
  }
}

export async function updateUser(id: string, data: { password?: string; role?: Role }) {
  try {
    const session = await verifyAdmin();
    
    // Prevent removing your own admin privileges
    if (session.id === id && data.role === 'ASSISTANT') {
      return { error: 'You cannot downgrade your own admin account.' };
    }

    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    if (data.password) {
      if (data.password.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logActivity('UPDATE_USER', `User: ${updatedUser.username}`);

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    console.error('Update user error:', error);
    return { error: 'Failed to update user' };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await verifyAdmin();

    if (session.id === id) {
      return { error: 'You cannot delete your own account.' };
    }

    const deletedUser = await prisma.user.delete({
      where: { id }
    });

    await logActivity('DELETE_USER', `User: ${deletedUser.username}`);

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    console.error('Delete user error:', error);
    return { error: 'Failed to delete user' };
  }
}
