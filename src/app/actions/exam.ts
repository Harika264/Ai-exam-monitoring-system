'use server';

import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createExamAction(formData: FormData) {
  const session = await verifySession();

  if (!session.isAuth || session.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const durationMinutes = parseInt(formData.get('durationMinutes') as string, 10);
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED';

  // Read questions
  const rawQuestions = formData.get('questions') as string;
  const parsedQuestions = JSON.parse(rawQuestions || '[]');

  if (!title || !durationMinutes) {
    return { error: 'Title and duration are required.' };
  }

  try {
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMinutes,
        status,
        createdById: session.userId as string,
        questions: {
          create: parsedQuestions.map((q: any, index: number) => ({
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            marks: parseInt(q.marks, 10) || 1,
            order: index + 1,
          })),
        },
      },
    });

    return { success: true, examId: exam.id };
  } catch (error) {
    console.error('Error creating exam:', error);
    return { error: 'Failed to create exam. Please check your inputs.' };
  }
}
