'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExamAction } from '@/app/actions/exam';
import { PlusCircle, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

type QuestionInput = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: string;
};

export default function CreateExamPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        marks: '1',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionInput, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    // Validate that questions have been added
    if (questions.length === 0) {
      setError('Please add at least one question to the exam.');
      setIsPending(false);
      return;
    }

    // Pass the questions array as a stringified JSON field
    formData.append('questions', JSON.stringify(questions));

    const result = await createExamAction(formData);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else if (result.success) {
      router.push('/admin/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg border border-gray-100 p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
            <p className="mt-2 text-sm text-gray-500">
              Fill in the exam details and add multiple-choice questions.
            </p>
          </div>

          <form action={handleSubmit} className="space-y-8">
            {/* Exam Details Section */}
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Exam Configuration</h2>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Exam Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                      placeholder="e.g., Final Assessment: Operating Systems"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description / Instructions
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                      placeholder="Write any specific instructions for the students here..."
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">
                    Duration (Minutes)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="durationMinutes"
                      id="durationMinutes"
                      required
                      min="1"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    >
                      <option value="DRAFT">Draft (Hidden)</option>
                      <option value="PUBLISHED">Published (Visible)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No questions added yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Click the button above to add your first multiple-choice question.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, index) => (
                    <div key={index} className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 relative">
                      <div className="absolute top-4 right-4">
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors"
                          title="Remove Question"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <h4 className="text-md font-medium text-gray-900 mb-4">Question {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <label className="block text-sm font-medium text-gray-700">Question Text</label>
                          <input
                            type="text"
                            required
                            value={q.questionText}
                            onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Option A</label>
                          <input
                            type="text"
                            required
                            value={q.optionA}
                            onChange={(e) => handleQuestionChange(index, 'optionA', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Option B</label>
                          <input
                            type="text"
                            required
                            value={q.optionB}
                            onChange={(e) => handleQuestionChange(index, 'optionB', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Option C</label>
                          <input
                            type="text"
                            required
                            value={q.optionC}
                            onChange={(e) => handleQuestionChange(index, 'optionC', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Option D</label>
                          <input
                            type="text"
                            required
                            value={q.optionD}
                            onChange={(e) => handleQuestionChange(index, 'optionD', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Correct Option</label>
                          <select
                            value={q.correctOption}
                            onChange={(e) => handleQuestionChange(index, 'correctOption', e.target.value as 'A' | 'B' | 'C' | 'D')}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Marks</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={q.marks}
                            onChange={(e) => handleQuestionChange(index, 'marks', e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md py-2 px-3 border"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-5 border-t border-gray-200 flex justify-end">
              <Link
                href="/admin/dashboard"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Save Exam
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
