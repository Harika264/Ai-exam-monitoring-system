'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveAnswerAction, submitExamAction, saveMonitoringEventAction } from '@/app/actions/attempt';
import { Camera, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order: number;
  marks: number;
};

type ExamProps = {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    questions: Question[];
  };
  attemptId: string;
};

export default function ExamClient({ exam, attemptId }: ExamProps) {
  const router = useRouter();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [monitoringActive, setMonitoringActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentQuestion = exam.questions[currentQuestionIndex];
  
  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = async (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    try {
      await saveAnswerAction(attemptId, currentQuestion.id, option);
    } catch (e) {
      console.error('Failed to save answer');
    }
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      await submitExamAction(attemptId);
      // Cleanup camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      router.push('/student/dashboard');
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  // AI Monitoring setup (Simplified)
  useEffect(() => {
    let active = true;
    let faceLandmarker: FaceLandmarker;
    let requestAnimFrameId: number;
    
    // AI Event states
    let noFaceStart: number | null = null;
    let multipleFacesStart: number | null = null;
    
    const initMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Load MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 2,
          minFaceDetectionConfidence: 0.6,
          minFacePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        
        setMonitoringActive(true);
        
        const detectFrame = async () => {
          if (!active || !videoRef.current) return;
          
          try {
            if (videoRef.current.currentTime > 0 && videoRef.current.videoWidth > 0) {
              const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());
              const numFaces = results.faceLandmarks ? results.faceLandmarks.length : 0;
              
              const now = Date.now();
              
              // Logic for FACE_MISSING
              if (numFaces === 0) {
                if (!noFaceStart) noFaceStart = now;
                else if (now - noFaceStart > 1500) {
                  // Trigger event after 1.5 seconds of no face
                  saveMonitoringEventAction({
                    attemptId,
                    eventType: 'FACE_MISSING',
                    severity: 'MEDIUM',
                    durationSeconds: Math.floor((now - noFaceStart) / 1000) || 1
                  });
                  setWarnings((w) => w + 1);
                  noFaceStart = null; // reset to avoid spam
                }
              } else {
                // Only reset if we actually see a face to avoid flickering false positives
                noFaceStart = null;
              }
              
              // Logic for MULTIPLE_FACES
              if (numFaces > 1) {
                if (!multipleFacesStart) multipleFacesStart = now;
                else if (now - multipleFacesStart > 1500) {
                  // Trigger event after 1.5 seconds
                  saveMonitoringEventAction({
                    attemptId,
                    eventType: 'MULTIPLE_FACES',
                    severity: 'HIGH',
                    durationSeconds: Math.floor((now - multipleFacesStart) / 1000) || 1
                  });
                  setWarnings((w) => w + 1);
                  multipleFacesStart = null;
                }
              } else {
                multipleFacesStart = null;
              }
            }
          } catch (error) {
            console.error("Error during face detection:", error);
          }
          
          requestAnimFrameId = requestAnimationFrame(detectFrame);
        };
        
        if (videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            detectFrame();
          } else {
            videoRef.current.addEventListener('loadeddata', detectFrame);
          }
        }
        
      } catch (err) {
        console.error("Monitoring init failed", err);
      }
    };
    
    initMonitoring();
    
    return () => {
      active = false;
      if (requestAnimFrameId) cancelAnimationFrame(requestAnimFrameId);
      if (faceLandmarker) faceLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [attemptId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 truncate pr-4">{exam.title}</h1>
          <div className="flex items-center space-x-6">
            <div className={`flex items-center font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
              <Clock className="h-5 w-5 mr-2" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Main Exam Area */}
        <div className="flex-grow flex flex-col space-y-6">
          <div className="bg-white shadow rounded-lg p-6 sm:p-8 flex-grow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-8 leading-relaxed">
              {currentQuestion.questionText}
            </h2>
            
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt;
                const optionText = currentQuestion[`option${opt}` as keyof Question];
                return (
                  <label
                    key={opt}
                    className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                      isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(opt)}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className={`block text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {opt}. {optionText}
                        </span>
                      </span>
                    </span>
                    {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between items-center bg-white p-4 shadow rounded-lg">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Previous
            </button>
            <div className="text-sm text-gray-500">
              Answered: {Object.keys(answers).length} / {exam.questions.length}
            </div>
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === exam.questions.length - 1}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 flex flex-col space-y-6 flex-shrink-0">
          
          {/* Monitoring Panel */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Camera className="h-4 w-4 mr-2 text-gray-500" /> AI Monitoring
              </h3>
              <span className={`flex h-3 w-3 relative`}>
                {monitoringActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${monitoringActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              </span>
            </div>
            <div className="p-4 bg-black relative aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!monitoringActive && <span className="text-gray-400 text-xs">Initializing...</span>}
            </div>
            {warnings > 0 && (
              <div className="bg-red-50 p-3 flex items-start border-t border-red-100">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-xs text-red-800">
                  Suspicious activity detected ({warnings} warnings). Continued violations may flag your attempt.
                </p>
              </div>
            )}
          </div>

          {/* Question Navigator */}
          <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 w-full rounded-md text-sm font-medium flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-100 text-blue-700'
                        : isAnswered
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
