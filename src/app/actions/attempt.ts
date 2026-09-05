'use server';

import { PrismaClient, EventType, Severity } from '@prisma/client';
import { verifySession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOption: string
) {
  const session = await verifySession();
  if (!session.isAuth || session.role !== 'STUDENT') {
    throw new Error('Unauthorized');
  }

  // Check if attempt is valid
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId, studentId: session.userId as string },
    include: { exam: true },
  });

  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    throw new Error('Invalid attempt');
  }

  // Find question to check correctness
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question || question.examId !== attempt.examId) {
    throw new Error('Invalid question');
  }

  const isCorrect = question.correctOption === selectedOption;

  // Upsert Answer
  await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: { selectedOption, isCorrect },
    create: { attemptId, questionId, selectedOption, isCorrect },
  });

  return { success: true };
}

export async function submitExamAction(attemptId: string) {
  const session = await verifySession();
  if (!session.isAuth || session.role !== 'STUDENT') {
    throw new Error('Unauthorized');
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId, studentId: session.userId as string },
    include: { exam: { include: { questions: true } }, answers: true, events: true },
  });

  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    throw new Error('Invalid attempt');
  }

  let score = 0;
  let totalMarks = 0;

  for (const q of attempt.exam.questions) {
    totalMarks += q.marks;
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (ans?.isCorrect) {
      score += q.marks;
    }
  }

  // Calculate monitoring score
  let monitoringScore = 0;
  for (const ev of attempt.events) {
    if (ev.eventType === 'FACE_MISSING') monitoringScore += 2;
    else if (ev.eventType === 'LOOKING_AWAY') monitoringScore += 1;
    else if (ev.eventType === 'MULTIPLE_FACES') monitoringScore += 5;
    else if (ev.eventType === 'PHONE_DETECTED') monitoringScore += 5;
    else if (ev.eventType === 'PERSON_ABSENT') monitoringScore += 4;
  }

  let reviewStatus: 'NORMAL' | 'REVIEWED' | 'FLAGGED' = 'NORMAL';
  if (monitoringScore >= 5) {
    reviewStatus = 'FLAGGED';
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      score,
      totalMarks,
      monitoringScore,
      reviewStatus,
    },
  });

  return { success: true };
}

export async function saveMonitoringEventAction(data: {
  attemptId: string;
  eventType: EventType;
  severity: Severity;
  confidence?: number;
  durationSeconds?: number;
}) {
  const session = await verifySession();
  if (!session.isAuth || session.role !== 'STUDENT') {
    return { error: 'Unauthorized' };
  }

  try {
    await prisma.monitoringEvent.create({
      data: {
        attemptId: data.attemptId,
        eventType: data.eventType,
        severity: data.severity,
        confidence: data.confidence,
        durationSeconds: data.durationSeconds,
        startedAt: new Date(Date.now() - (data.durationSeconds || 0) * 1000),
        endedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to save monitoring event', error);
    return { error: 'Failed to save event' };
  }
}
