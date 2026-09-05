import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, PlayCircle, CheckCircle } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

const prisma = new PrismaClient();

export default async function StudentDashboard() {
  const session = await verifySession();

  if (!session.isAuth || session.role !== 'STUDENT') {
    redirect('/login');
  }

  // Fetch all published exams
  const availableExams = await prisma.exam.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch the student's attempts
  const attempts = await prisma.attempt.findMany({
    where: { studentId: session.userId },
    include: { exam: true },
  });

  const attemptedExamIds = new Set(attempts.map((a) => a.examId));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="ml-2 font-bold text-xl text-gray-900">Student Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {session.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Exams</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableExams.map((exam) => {
            const hasAttempted = attemptedExamIds.has(exam.id);
            const attempt = attempts.find((a) => a.examId === exam.id);

            return (
              <div
                key={exam.id}
                className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex flex-col"
              >
                <div className="px-4 py-5 sm:p-6 flex-grow">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {exam.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="font-medium mr-2">Duration:</span> {exam.durationMinutes} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Status:</span>
                    {hasAttempted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Available
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 mt-auto">
                  {hasAttempted ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        Score: {attempt?.score !== null ? `${attempt?.score} / ${attempt?.totalMarks}` : 'Pending'}
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ) : (
                    <Link
                      href={`/student/exams/${exam.id}/setup`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Exam
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {availableExams.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exams available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no published exams to take. Check back later.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
