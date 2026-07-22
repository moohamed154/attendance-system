import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Starting test data seeding for Version 1.1...');

  // 1. Seed Sessions for grade1, grade2, grade3
  const sessionsData = [
    {
      grade: 'grade1',
      subject: 'اللغة العربية',
      teacherName: 'د. أسامة محمود',
      dayOfWeek: 0, // Sunday
      time: '16:00',
      room: 'القاعة الكبرى (Room A1)',
      capacity: 40,
      reservedSeats: 12,
      confirmedSeats: 8,
      price: 150,
      status: 'OPEN',
      description: 'كورس مراجعة البلاغة والنحو للصف الأول الثانوي',
    },
    {
      grade: 'grade1',
      subject: 'الفيزياء',
      teacherName: 'أ. محمد عبد الفتاح',
      dayOfWeek: 2, // Tuesday
      time: '18:00',
      room: 'معمل الفيزياء (Lab 2)',
      capacity: 35,
      reservedSeats: 8,
      confirmedSeats: 5,
      price: 200,
      status: 'OPEN',
      description: 'الشرح والحصص التفاعلية في الفيزياء العامة',
    },
    {
      grade: 'grade2',
      subject: 'الكيمياء',
      teacherName: 'د. أحمد إبراهيم',
      dayOfWeek: 1, // Monday
      time: '17:00',
      room: 'قاعة التفوق (Room B1)',
      capacity: 30,
      reservedSeats: 15,
      confirmedSeats: 10,
      price: 220,
      status: 'OPEN',
      description: 'مادة الكيمياء العضوية والغير عضوية',
    },
    {
      grade: 'grade2',
      subject: 'الرياضيات',
      teacherName: 'أ. محمود سامي',
      dayOfWeek: 3, // Wednesday
      time: '15:00',
      room: 'القاعة الرئيسية (Auditorium)',
      capacity: 50,
      reservedSeats: 20,
      confirmedSeats: 14,
      price: 200,
      status: 'OPEN',
      description: 'كورس الجبر والتفاضل وحساب المثلثات',
    },
    {
      grade: 'grade3',
      subject: 'الفيزياء المتقدمة',
      teacherName: 'أ.د. مصطفى الشريف',
      dayOfWeek: 6, // Saturday
      time: '10:00',
      room: 'المدرج الرئيسي',
      capacity: 60,
      reservedSeats: 35,
      confirmedSeats: 28,
      price: 300,
      status: 'OPEN',
      description: 'حصص المراجعة النهائية والتطبيقات للثانوية العامة',
    },
    {
      grade: 'grade3',
      subject: 'الأدب والبلاغة',
      teacherName: 'د. أسامة محمود',
      dayOfWeek: 4, // Thursday
      time: '14:00',
      room: 'قاعة 3',
      capacity: 45,
      reservedSeats: 18,
      confirmedSeats: 12,
      price: 250,
      status: 'OPEN',
      description: 'مراجعة النصوص البلاغية والأدب العربي',
    },
  ];

  const createdSessions = [];
  for (const sData of sessionsData) {
    const existing = await prisma.session.findFirst({
      where: {
        grade: sData.grade,
        subject: sData.subject,
        time: sData.time,
      },
    });

    if (existing) {
      createdSessions.push(existing);
    } else {
      const newSession = await prisma.session.create({
        data: sData,
      });
      createdSessions.push(newSession);
    }
  }
  console.log(`✅ Created/verified ${createdSessions.length} test sessions.`);

  // 2. Seed Test Students & Active Reservations for Lookup Testing
  const student1Phone = '01012345678';
  const student2Phone = '01234567890';

  let student1 = await prisma.student.findUnique({
    where: { studentPhone: student1Phone },
  });

  if (!student1) {
    student1 = await prisma.student.create({
      data: {
        studentId: 'STU-TEST-001',
        name: 'أحمد محمد علي',
        studentPhone: student1Phone,
        parentPhone: '01011112222',
        grade: 'grade1',
        school: 'مدرسة المتفوقين الثانوية',
        studentType: 'Male',
        sessionId: createdSessions[0].id,
      },
    });
  }

  let student2 = await prisma.student.findUnique({
    where: { studentPhone: student2Phone },
  });

  if (!student2) {
    student2 = await prisma.student.create({
      data: {
        studentId: 'STU-TEST-002',
        name: 'سارة إبراهيم الشافعي',
        studentPhone: student2Phone,
        parentPhone: '01233334444',
        grade: 'grade2',
        school: 'مدرسة النور اللغات',
        studentType: 'Female',
        sessionId: createdSessions[2].id,
      },
    });
  }

  // Create Reservation 1 (Confirmed)
  const res1Number = 'RES-20260722-100001';
  const res1Code = '4F8K-92LM';

  const existingRes1 = await prisma.reservation.findUnique({
    where: { reservationNumber: res1Number },
  });

  if (!existingRes1) {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const res1 = await prisma.reservation.create({
      data: {
        reservationNumber: res1Number,
        trackingCode: res1Code,
        studentId: student1.id,
        sessionId: createdSessions[0].id,
        parentName: 'محمد علي حسن',
        studentPhone: student1Phone,
        status: 'CONFIRMED',
        expiresAt,
        confirmedAt: new Date(),
        notes: 'تم الدفع بالكامل تأكيد حجز مقعد القاعة الكبرى',
      },
    });

    await prisma.reservationStatusHistory.create({
      data: {
        reservationId: res1.id,
        newStatus: 'CONFIRMED',
        changedById: 'System Admin',
        reason: 'تأكيد الحجز التلقائي بعد دفع الرسوم',
      },
    });
  }

  // Create Reservation 2 (Pending)
  const res2Number = 'RES-20260722-100002';
  const res2Code = '7B9X-31KP';

  const existingRes2 = await prisma.reservation.findUnique({
    where: { reservationNumber: res2Number },
  });

  if (!existingRes2) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res2 = await prisma.reservation.create({
      data: {
        reservationNumber: res2Number,
        trackingCode: res2Code,
        studentId: student2.id,
        sessionId: createdSessions[2].id,
        parentName: 'إبراهيم الشافعي',
        studentPhone: student2Phone,
        status: 'PENDING',
        expiresAt,
        notes: 'حجز قيد الانتظار لمادة الكيمياء',
      },
    });

    await prisma.reservationStatusHistory.create({
      data: {
        reservationId: res2.id,
        newStatus: 'PENDING',
        changedById: 'Public Student Portal',
        reason: 'إنشاء حجز مبدئي جديد من البوابة',
      },
    });
  }

  console.log('🎉 Test data seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('📌 Sample Test Reservation 1 (CONFIRMED):');
  console.log(`   Reservation Number: ${res1Number}`);
  console.log(`   Tracking Code:      ${res1Code}`);
  console.log('📌 Sample Test Reservation 2 (PENDING):');
  console.log(`   Reservation Number: ${res2Number}`);
  console.log(`   Tracking Code:      ${res2Code}`);
  console.log('----------------------------------------------------');
}

seedTestData()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
