import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const assistantPassword = await bcrypt.hash('assistant123', 10)

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const assistant = await prisma.user.upsert({
    where: { username: 'assistant' },
    update: {},
    create: {
      username: 'assistant',
      password: assistantPassword,
      role: 'ASSISTANT',
    },
  })

  // Seed Settings
  await prisma.setting.upsert({
    where: { key: 'centerName' },
    update: {},
    create: { key: 'centerName', value: 'Excellence Academy' }
  })
  
  await prisma.setting.upsert({
    where: { key: 'teacherName' },
    update: {},
    create: { key: 'teacherName', value: 'Mr. Smith' }
  })

  // Seed Sessions
  const s1 = await prisma.session.create({
    data: {
      dayOfWeek: new Date().getDay(), // Create one for TODAY to show up immediately
      time: '16:00',
      grade: 'Grade 3'
    }
  })

  const s2 = await prisma.session.create({
    data: {
      dayOfWeek: new Date().getDay(), // Create another for TODAY
      time: '18:00',
      grade: 'Grade 4'
    }
  })

  // Seed Students
  for (let i = 1; i <= 5; i++) {
    await prisma.student.create({
      data: {
        studentId: `STU-00${i}`,
        name: `Student ${i}`,
        studentPhone: `0100000000${i}`,
        studentType: 'Male',
        grade: 'Grade 3',
        sessionId: s1.id,
      }
    })
  }

  for (let i = 6; i <= 10; i++) {
    await prisma.student.create({
      data: {
        studentId: `STU-00${i}`,
        name: `Student ${i}`,
        studentPhone: `010000000${i}`,
        studentType: 'Female',
        grade: 'Grade 4',
        sessionId: s2.id,
      }
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
