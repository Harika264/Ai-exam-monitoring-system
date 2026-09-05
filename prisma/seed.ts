import { PrismaClient, Role, ExamStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student@example.com'
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'student123'

  console.log('Seeding database...')

  // Create Admin
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  })
  console.log(`✅ Admin created: ${admin.email}`)

  // Create Student
  const studentPasswordHash = await bcrypt.hash(studentPassword, 10)
  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      name: 'Sample Student',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  })
  console.log(`✅ Student created: ${student.email}`)

  // Create Sample Exam
  const exam = await prisma.exam.create({
    data: {
      title: 'Sample Data Structures Exam',
      description: 'A mock exam to test the AI monitoring system features.',
      durationMinutes: 30,
      status: ExamStatus.PUBLISHED,
      createdById: admin.id,
      questions: {
        create: [
          {
            questionText: 'What data structure uses LIFO (Last In First Out)?',
            optionA: 'Queue',
            optionB: 'Stack',
            optionC: 'Tree',
            optionD: 'Graph',
            correctOption: 'B',
            marks: 1,
            order: 1,
          },
          {
            questionText: 'Which algorithm is used to find the shortest path in a graph?',
            optionA: 'Dijkstra',
            optionB: 'Merge Sort',
            optionC: 'Binary Search',
            optionD: 'Quick Sort',
            correctOption: 'A',
            marks: 1,
            order: 2,
          }
        ]
      }
    }
  })
  console.log(`✅ Exam created: ${exam.title}`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
