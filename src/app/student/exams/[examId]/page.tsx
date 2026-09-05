import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExamClient from './exam-client';

const prisma = new PrismaClient();

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const session = await verifySession();
  const { examId } = await params;

  if (!session.isAuth || session.role !== 'STUDENT') {
    redirect('/login');
  }

  // Fetch exam with questions
  const exam = await prisma.exam.findUnique({
    where: { id: examId, status: 'PUBLISHED' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!exam) {
    redirect('/student/dashboard');
  }

  // Check if student already attempted
  const existingAttempt = await prisma.attempt.findUnique({
    where: { examId_studentId: { examId, studentId: session.userId as string } },
  });

  if (existingAttempt) {
    redirect('/student/dashboard');
  }

  // Create Attempt
  const attempt = await prisma.attempt.create({
    data: {
      examId,
      studentId: session.userId as string,
      status: 'IN_PROGRESS',
    },
  });

  // Pass necessary data to the client component
  // Strip out correctOption before sending to client for security
  const safeQuestions = exam.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    order: q.order,
    marks: q.marks,
  }));

  return (
    <ExamClient
      exam={{
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        questions: safeQuestions,
      }}
      attemptId={attempt.id}
    />
  );
}
