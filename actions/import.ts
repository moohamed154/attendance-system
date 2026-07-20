'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import * as bcrypt from 'bcrypt';

type ImportRow = {
  excelStudentId: string;
  studentName: string;
  studentPhone: string;
  parentPhone?: string;
  grade: string;
  day: string | number;
  time: string;
  studentType?: string;
  month?: string;
  notes?: string;
  monthlyFee?: string | number;
  createdDate?: string;
  receiver?: string;
};

type ImportSummary = {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
};

// Map day strings to 0-6
const parseDay = (dayStr: string | number): number => {
  if (typeof dayStr === 'number') {
    const num = dayStr % 7;
    if ([0, 2, 4].includes(num)) return 0;
    if ([6, 1, 3].includes(num)) return 1;
    return -1;
  }
  const d = dayStr.toString().toLowerCase().trim();
  const group0 = ['sunday', 'sun', '0', 'الاحد', 'الأحد', 'احد', 'أحد', 'حد', 'tuesday', 'tue', '2', 'الثلاثاء', 'ثلاثاء', 'تلات', 'thursday', 'thu', '4', 'الخميس', 'خميس'];
  const group1 = ['saturday', 'sat', '6', 'السبت', 'سبت', 'monday', 'mon', '1', 'الاثنين', 'الإثنين', 'اثنين', 'إثنين', 'اتنين', 'wednesday', 'wed', '3', 'الاربعاء', 'الأربعاء', 'اربعاء', 'أربعاء', 'اربع'];
  
  if (group0.includes(d)) return 0;
  if (group1.includes(d)) return 1;
  return -1;
};

// Parse excel time, which can be decimal or string
const parseTime = (timeVal: string | number): string => {
  if (typeof timeVal === 'number') {
    const totalMinutes = Math.round(timeVal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  return timeVal.toString().trim();
};

export async function processExcelImport(rows: ImportRow[]): Promise<{ summary?: ImportSummary; error?: string }> {
  try {
    const authSession = await getSession();
    if (authSession?.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const summary: ImportSummary = { imported: 0, updated: 0, skipped: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2; 

      if (!row.excelStudentId || row.excelStudentId.toString().trim() === '') {
        summary.skipped++;
        continue; // silently skip empty rows (no error message needed)
      }

      if (!row.studentName || row.studentName.toString().trim() === '') {
        summary.skipped++;
        continue; // silently skip header/empty rows
      }

      const phoneRegex = /^(010|011|012|015)\d{8}$/;
      const studentPhone = row.studentPhone?.toString().trim();
      if (!studentPhone || !phoneRegex.test(studentPhone)) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNum}: Missing or invalid Student Phone (${row.studentPhone || 'empty'}). Must be a valid 11-digit Egyptian mobile number.`);
        continue;
      }

      let gender = row.studentType?.toString().trim();
      if (gender?.toLowerCase() === 'male' || gender === 'ذكر') {
        gender = 'Male';
      } else if (gender?.toLowerCase() === 'female' || gender === 'أنثى') {
        gender = 'Female';
      } else {
        // Default to Male if missing or invalid, as backfill strategy approved
        gender = 'Male';
      }

      if (!row.grade || row.day === undefined || !row.time) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNum}: Missing required fields (Grade, Day, Time)`);
        continue;
      }

      const parsedDay = parseDay(row.day);
      if (parsedDay === -1) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNum}: Invalid day format '${row.day}'`);
        continue;
      }

      const parsedTime = parseTime(row.time);

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Find or create the session
          let session = await tx.session.findFirst({
            where: {
              dayOfWeek: parsedDay,
              time: parsedTime,
              grade: row.grade.toString().trim(),
            }
          });

          if (!session) {
            session = await tx.session.create({
              data: {
                dayOfWeek: parsedDay,
                time: parsedTime,
                grade: row.grade.toString().trim(),
              }
            });
          }

          const fee = row.monthlyFee ? parseFloat(row.monthlyFee.toString()) : null;
          let baseStudentId = row.excelStudentId.toString().trim();
          
          // Duplicate Detection: If a student exists, check if they are in the same session.
          // If they are in a different session, generate a new ID (e.g., 1234-2, 1234-3).
          let existingStudent = await tx.student.findFirst({
            where: { studentId: baseStudentId }
          });
          
          if (existingStudent && existingStudent.sessionId !== session.id) {
            // Find a unique studentId suffix
            let counter = 2;
            let newStudentId = `${baseStudentId}-${counter}`;
            while (await tx.student.findFirst({ where: { studentId: newStudentId } })) {
              counter++;
              newStudentId = `${baseStudentId}-${counter}`;
            }
            // By setting existingStudent to null, we force the creation of a new student below
            existingStudent = null;
            baseStudentId = newStudentId;
          }

          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();

          if (existingStudent) {
            await tx.student.update({
              where: { id: existingStudent.id },
              data: {
                name: row.studentName.toString().trim(),
                grade: row.grade.toString().trim(),
                studentPhone,
                parentPhone: row.parentPhone?.toString() || existingStudent.parentPhone,
                monthlyFee: fee !== null && !isNaN(fee) ? fee : existingStudent.monthlyFee,
                notes: row.notes?.toString() || existingStudent.notes,
                studentType: gender,
                importMonth: row.month?.toString() || existingStudent.importMonth,
                createdDate: row.createdDate?.toString() || existingStudent.createdDate,
                receiver: row.receiver?.toString() || existingStudent.receiver,
                sessionId: session.id, // Ensure they are assigned to the session
              }
            });

            // Upsert Payment for current month (don't overwrite existing paid records)
            const existingPayment = await tx.payment.findFirst({
              where: {
                studentId: existingStudent.id,
                month: currentMonth,
                year: currentYear,
              }
            });

            if (!existingPayment) {
              const finalFee = fee !== null && !isNaN(fee) ? fee : existingStudent.monthlyFee;
              await tx.payment.create({
                data: {
                  studentId: existingStudent.id,
                  amount: finalFee || 0,
                  month: currentMonth,
                  year: currentYear,
                  status: 'UNPAID',
                }
              });
            }

            summary.updated++;
          } else {
            // Create new student with auto-generated password hash (Excel ID as default password)
            const passwordHash = await bcrypt.hash(baseStudentId, 10);
            const newStudent = await tx.student.create({
              data: {
                studentId: baseStudentId,
                name: row.studentName.toString().trim(),
                studentPhone,
                parentPhone: row.parentPhone?.toString() || null,
                grade: row.grade.toString().trim(),
                monthlyFee: fee !== null && !isNaN(fee) ? fee : null,
                notes: row.notes?.toString() || null,
                studentType: gender,
                importMonth: row.month?.toString() || null,
                createdDate: row.createdDate?.toString() || null,
                receiver: row.receiver?.toString() || null,
                sessionId: session.id,
                passwordHash,
                mustChangePassword: true,
              }
            });

            // Create Payment for current month
            await tx.payment.create({
              data: {
                studentId: newStudent.id,
                amount: fee || 0,
                month: currentMonth,
                year: currentYear,
                status: fee !== null && !isNaN(fee) ? 'PAID' : 'UNPAID',
                paidAt: fee !== null && !isNaN(fee) ? new Date() : null,
              }
            });

            summary.imported++;
          }
        });
      } catch (err: any) {
        summary.skipped++;
        summary.errors.push(`Row ${rowNum}: Database error - ${err.message}`);
      }
    }

    revalidatePath('/dashboard');
    await logActivity('Excel Import Completed', `Imported ${summary.imported} students, skipped ${summary.skipped}`);

    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/sessions');

    return { summary };
  } catch (error: any) {
    return { error: error.message || 'Failed to process import' };
  }
}
