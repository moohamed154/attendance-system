const connectionString = 'postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const endpoint = 'https://ep-weathered-pine-aslto6hf.c-4.eu-central-1.aws.neon.tech/sql';

async function queryNeon(sql) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': connectionString,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }
  return await response.json();
}

async function seed() {
  console.log('🌱 Seeding database via Neon HTTP API...');

  // 1. Create Sessions
  const sessions = [
    {
      id: 'sess_grade1_arabic',
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
      id: 'sess_grade1_physics',
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
      id: 'sess_grade2_chemistry',
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
      id: 'sess_grade2_math',
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
      id: 'sess_grade3_physics_adv',
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
      id: 'sess_grade3_arabic_lit',
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

  for (const s of sessions) {
    const sql = `
      INSERT INTO "Session" (id, grade, subject, "teacherName", "dayOfWeek", time, room, capacity, "reservedSeats", "confirmedSeats", price, status, description, "isArchived", "createdAt", "updatedAt")
      VALUES ('${s.id}', '${s.grade}', '${s.subject}', '${s.teacherName}', ${s.dayOfWeek}, '${s.time}', '${s.room}', ${s.capacity}, ${s.reservedSeats}, ${s.confirmedSeats}, ${s.price}, '${s.status}', '${s.description}', false, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        grade = '${s.grade}',
        subject = '${s.subject}',
        "teacherName" = '${s.teacherName}',
        status = '${s.status}',
        capacity = ${s.capacity};
    `;
    await queryNeon(sql);
  }
  console.log('✅ Seeded 6 sessions successfully!');

  // 2. Create Sample Students
  const students = [
    {
      id: 'stu_test_001',
      studentId: 'STU-TEST-001',
      name: 'أحمد محمد علي',
      studentPhone: '01012345678',
      parentPhone: '01011112222',
      grade: 'grade1',
      school: 'مدرسة المتفوقين الثانوية',
      studentType: 'Male',
      sessionId: 'sess_grade1_arabic',
    },
    {
      id: 'stu_test_002',
      studentId: 'STU-TEST-002',
      name: 'سارة إبراهيم الشافعي',
      studentPhone: '01234567890',
      parentPhone: '01233334444',
      grade: 'grade2',
      school: 'مدرسة النور اللغات',
      studentType: 'Female',
      sessionId: 'sess_grade2_chemistry',
    },
  ];

  for (const stu of students) {
    const sql = `
      INSERT INTO "Student" (id, "studentId", name, "studentPhone", "parentPhone", grade, school, "studentType", "sessionId", "isArchived", "mustChangePassword", "createdAt", "updatedAt")
      VALUES ('${stu.id}', '${stu.studentId}', '${stu.name}', '${stu.studentPhone}', '${stu.parentPhone}', '${stu.grade}', '${stu.school}', '${stu.studentType}', '${stu.sessionId}', false, true, NOW(), NOW())
      ON CONFLICT ("studentPhone") DO UPDATE SET
        name = '${stu.name}',
        school = '${stu.school}';
    `;
    await queryNeon(sql);
  }
  console.log('✅ Seeded 2 test students successfully!');

  // 3. Create Reservations for testing lookup
  const res1Number = 'RES-20260722-100001';
  const res1Code = '4F8K-92LM';

  const res1Sql = `
    INSERT INTO "Reservation" (id, "reservationNumber", "trackingCode", "studentId", "sessionId", "parentName", "studentPhone", status, "reservedAt", "expiresAt", "confirmedAt", notes, "createdAt", "updatedAt")
    VALUES (
      'res_test_001',
      '${res1Number}',
      '${res1Code}',
      'stu_test_001',
      'sess_grade1_arabic',
      'محمد علي حسن',
      '01012345678',
      'CONFIRMED',
      NOW(),
      NOW() + INTERVAL '2 DAYS',
      NOW(),
      'تم الدفع بالكامل تأكيد حجز مقعد القاعة الكبرى',
      NOW(),
      NOW()
    )
    ON CONFLICT ("reservationNumber") DO UPDATE SET
      "trackingCode" = '${res1Code}',
      status = 'CONFIRMED';
  `;
  await queryNeon(res1Sql);

  const res2Number = 'RES-20260722-100002';
  const res2Code = '7B9X-31KP';

  const res2Sql = `
    INSERT INTO "Reservation" (id, "reservationNumber", "trackingCode", "studentId", "sessionId", "parentName", "studentPhone", status, "reservedAt", "expiresAt", notes, "createdAt", "updatedAt")
    VALUES (
      'res_test_002',
      '${res2Number}',
      '${res2Code}',
      'stu_test_002',
      'sess_grade2_chemistry',
      'إبراهيم الشافعي',
      '01234567890',
      'PENDING',
      NOW(),
      NOW() + INTERVAL '1 DAY',
      'حجز قيد الانتظار لمادة الكيمياء',
      NOW(),
      NOW()
    )
    ON CONFLICT ("reservationNumber") DO UPDATE SET
      "trackingCode" = '${res2Code}',
      status = 'PENDING';
  `;
  await queryNeon(res2Sql);

  console.log('🎉 Seed script executed successfully!');
  console.log('----------------------------------------------------');
  console.log('📌 Sample Test Reservation 1 (CONFIRMED):');
  console.log(`   Reservation Number: ${res1Number}`);
  console.log(`   Tracking Code:      ${res1Code}`);
  console.log('📌 Sample Test Reservation 2 (PENDING):');
  console.log(`   Reservation Number: ${res2Number}`);
  console.log(`   Tracking Code:      ${res2Code}`);
  console.log('----------------------------------------------------');
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
