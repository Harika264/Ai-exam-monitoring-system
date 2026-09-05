import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, User, Clock, Check } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Server action to update review status
async function updateReviewStatus(formData: FormData) {
  'use server';
  
  const attemptId = formData.get('attemptId') as string;
  const status = formData.get('status') as 'NORMAL' | 'REVIEWED' | 'FLAGGED';
  
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { reviewStatus: status },
  });
  
  revalidatePath(`/admin/attempts/${attemptId}`);
}

export default async function AdminReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await verifySession();
  const { attemptId } = await params;

  if (!session.isAuth || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      exam: true,
      events: {
        orderBy: { startedAt: 'asc' },
      },
    },
  });

  if (!attempt) {
    redirect('/admin/dashboard');
  }

  // Count events
  const multipleFacesEvents = attempt.events.filter((e) => e.eventType === 'MULTIPLE_FACES').length;
  const faceMissingEvents = attempt.events.filter((e) => e.eventType === 'FACE_MISSING').length;
  const phoneDetectedEvents = attempt.events.filter((e) => e.eventType === 'PHONE_DETECTED').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Attempt Details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Student Info */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                Student Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name:</dt>
                  <dd className="font-medium text-gray-900">{attempt.student.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email:</dt>
                  <dd className="font-medium text-gray-900">{attempt.student.email}</dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <dt className="text-gray-500">Exam:</dt>
                  <dd className="font-medium text-gray-900 text-right">{attempt.exam.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Score:</dt>
                  <dd className="font-medium text-gray-900">
                    {attempt.score !== null ? `${attempt.score} / ${attempt.totalMarks}` : 'Pending'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration:</dt>
                  <dd className="font-medium text-gray-900">
                    {attempt.submittedAt && attempt.startedAt
                      ? `${Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 60000)} mins`
                      : 'In Progress'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Admin Action */}
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Decision</h3>
              <form action={updateReviewStatus} className="space-y-4">
                <input type="hidden" name="attemptId" value={attempt.id} />
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="status" value="NORMAL" defaultChecked={attempt.reviewStatus === 'NORMAL'} className="text-blue-600 focus:ring-blue-500 h-4 w-4" />
                    <span className="text-sm font-medium text-gray-900">Normal (No Action Needed)</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 border-orange-200 bg-orange-50">
                    <input type="radio" name="status" value="FLAGGED" defaultChecked={attempt.reviewStatus === 'FLAGGED'} className="text-orange-600 focus:ring-orange-500 h-4 w-4" />
                    <span className="text-sm font-medium text-orange-900">Flagged (Suspicious Activity)</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 border-green-200 bg-green-50">
                    <input type="radio" name="status" value="REVIEWED" defaultChecked={attempt.reviewStatus === 'REVIEWED'} className="text-green-600 focus:ring-green-500 h-4 w-4" />
                    <span className="text-sm font-medium text-green-900">Reviewed & Cleared</span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Decision
                </button>
              </form>
            </div>
            
          </div>

          {/* Right Column: Monitoring Report */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Risk Summary Card */}
            <div className={`shadow rounded-lg p-6 border ${attempt.monitoringScore > 5 ? 'bg-red-50 border-red-200' : attempt.monitoringScore > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Monitoring Report</h2>
                <div className={`px-4 py-1 rounded-full text-sm font-bold ${attempt.monitoringScore > 5 ? 'bg-red-200 text-red-800' : attempt.monitoringScore > 0 ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                  RISK SCORE: {attempt.monitoringScore}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mt-6">
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{multipleFacesEvents}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Multiple Faces</div>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{faceMissingEvents}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Face Missing</div>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{phoneDetectedEvents}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Phone Detected</div>
                </div>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Event Timeline</h3>
                <span className="text-sm text-gray-500">{attempt.events.length} Events Logged</span>
              </div>
              
              <div className="p-6">
                {attempt.events.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Suspicious Activity</h3>
                    <p className="mt-1 text-sm text-gray-500">The AI monitor did not detect any concerning events during this exam.</p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {attempt.events.map((event, eventIdx) => (
                        <li key={event.id}>
                          <div className="relative pb-8">
                            {eventIdx !== attempt.events.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  event.severity === 'HIGH' ? 'bg-red-500' : event.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-400'
                                }`}>
                                  <AlertTriangle className="h-4 w-4 text-white" aria-hidden="true" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.eventType.replace('_', ' ')}
                                  </p>
                                  {event.durationSeconds && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Duration: {event.durationSeconds} seconds
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 flex flex-col items-end">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                    <time dateTime={event.startedAt.toISOString()}>
                                      {event.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </time>
                                  </div>
                                  <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    event.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {event.severity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
