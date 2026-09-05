'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ExamSetupPage({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  const { examId } = use(params);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    return () => {
      // Cleanup stream when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const requestCameraAccess = async () => {
    setCameraStatus('LOADING');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      setStream(mediaStream);
      setCameraStatus('SUCCESS');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraStatus('ERROR');
      setErrorMessage(
        'Camera permission is required to take this monitored exam. Please allow camera access in your browser and try again.'
      );
    }
  };

  // Attach the stream to the video element once it renders
  useEffect(() => {
    if (cameraStatus === 'SUCCESS' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraStatus, stream]);

  const handleStartExam = () => {
    // In a real app, you might want to call an API to mark the attempt as STARTED
    router.push(`/student/exams/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Pre-Exam System Check</h2>
            <p className="text-gray-500">
              Please ensure your camera is working before starting the exam. 
              This exam is AI-monitored.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Camera Preview */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-gray-900 rounded-lg overflow-hidden aspect-video relative flex items-center justify-center border-4 border-gray-200 shadow-inner">
                {cameraStatus === 'SUCCESS' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <Camera className="h-12 w-12 mb-2" />
                    <span>Camera Preview</span>
                  </div>
                )}
              </div>

              {cameraStatus === 'IDLE' && (
                <button
                  onClick={requestCameraAccess}
                  className="mt-6 w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Grant Camera Access
                </button>
              )}
              {cameraStatus === 'LOADING' && (
                <div className="mt-6 text-blue-600 flex items-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Requesting access...
                </div>
              )}
              {cameraStatus === 'ERROR' && (
                <div className="mt-6 w-full text-center">
                  <p className="text-red-600 text-sm font-medium mb-3">{errorMessage}</p>
                  <button
                    onClick={requestCameraAccess}
                    className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Retry Access
                  </button>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Readiness Checklist</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      {cameraStatus === 'SUCCESS' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                      )}
                    </div>
                    <p className="ml-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900 block">Camera Permission</span>
                      Must be granted to proceed.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      {cameraStatus === 'SUCCESS' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    <p className="ml-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900 block">Face Visibility</span>
                      Ensure your face is clearly visible and well-lit.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      {cameraStatus === 'SUCCESS' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    <p className="ml-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-900 block">Browser Compatibility</span>
                      Please use a modern desktop browser.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <Link
                    href="/student/dashboard"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleStartExam}
                    disabled={cameraStatus !== 'SUCCESS'}
                    className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Exam
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
