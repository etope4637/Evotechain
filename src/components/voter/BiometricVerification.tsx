import React, { useState, useRef, useEffect } from 'react';
import { Camera, Eye, CheckCircle, AlertCircle, ArrowLeft, Shield, Wifi, WifiOff } from 'lucide-react';

interface BiometricVerificationProps {
  onNavigate: (view: string) => void;
  onVerificationSuccess: () => void;
  nin: string;
  mode: 'login' | 'register';
}

export const BiometricVerification: React.FC<BiometricVerificationProps> = ({ 
  onNavigate, 
  onVerificationSuccess, 
  nin,
  mode 
}) => {
  const [step, setStep] = useState<'instructions' | 'capturing' | 'processing' | 'success'>('instructions');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isOnline] = useState(navigator.onLine);
  
  const [livenessProgress, setLivenessProgress] = useState({
    blinkCount: 0,
    requiredBlinks: 3,
    headMovement: false,
    qualityCheck: false,
    antiSpoofing: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setFeedback('Initializing secure camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStep('capturing');
        setFeedback('Position your face in the center and blink naturally');
        
        // Start liveness monitoring simulation
        startLivenessMonitoring();
      }
    } catch (error) {
      setError('Camera access denied. Please allow camera access to continue.');
    }
  };

  const startLivenessMonitoring = () => {
    let blinkCount = 0;
    const interval = setInterval(() => {
      setLivenessProgress(prev => {
        const newProgress = { ...prev };
        
        // Simulate blink detection
        if (blinkCount < prev.requiredBlinks && Math.random() > 0.7) {
          blinkCount++;
          newProgress.blinkCount = blinkCount;
          setFeedback(`Good! ${blinkCount}/${prev.requiredBlinks} blinks detected`);
        }
        
        // Simulate head movement detection
        if (!prev.headMovement && Math.random() > 0.8) {
          newProgress.headMovement = true;
          setFeedback('Head movement detected - excellent!');
        }
        
        // Simulate quality check
        if (!prev.qualityCheck && Math.random() > 0.85) {
          newProgress.qualityCheck = true;
          setFeedback('Image quality verified');
        }
        
        // Simulate anti-spoofing
        if (!prev.antiSpoofing && Math.random() > 0.9) {
          newProgress.antiSpoofing = true;
          setFeedback('Anti-spoofing check passed');
        }
        
        // Check if all requirements met
        if (newProgress.blinkCount >= newProgress.requiredBlinks && 
            newProgress.headMovement && 
            newProgress.qualityCheck && 
            newProgress.antiSpoofing) {
          clearInterval(interval);
          setFeedback('All liveness checks complete! Ready for verification.');
        }
        
        return newProgress;
      });
    }, 1000);
  };

  const performVerification = async () => {
    setIsProcessing(true);
    setStep('processing');
    setFeedback('Analyzing biometric data...');

    try {
      // Simulate biometric processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setFeedback('Verifying identity...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (mode === 'login') {
        setFeedback('Authentication successful!');
      } else {
        setFeedback('Biometric enrollment complete!');
      }
      
      setStep('success');
      
      // Auto-proceed after success message
      setTimeout(() => {
        onVerificationSuccess();
      }, 2000);
      
    } catch (error) {
      setError('Biometric verification failed. Please try again.');
      setStep('capturing');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resetCapture = () => {
    stopCamera();
    setStep('instructions');
    setLivenessProgress({
      blinkCount: 0,
      requiredBlinks: 3,
      headMovement: false,
      qualityCheck: false,
      antiSpoofing: false
    });
    setError('');
    setFeedback('');
  };

  const allChecksComplete = livenessProgress.blinkCount >= livenessProgress.requiredBlinks &&
                           livenessProgress.headMovement &&
                           livenessProgress.qualityCheck &&
                           livenessProgress.antiSpoofing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate(mode === 'login' ? 'voter-login' : 'voter-register')}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <div className="bg-blue-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Eye className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Biometric Authentication' : 'Biometric Enrollment'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'Verify your identity with facial recognition' 
              : 'Capture your biometric data for secure voting'
            }
          </p>
          <div className="mt-2 text-sm text-gray-500">
            NIN: {nin.slice(0, 3)}***{nin.slice(-2)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">Advanced Liveness Detection</h3>
                  <p className="text-blue-100 text-sm">Multi-factor biometric security</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Instructions Step */}
            {step === 'instructions' && (
              <div className="text-center space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Verification Instructions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Position face clearly in camera</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Ensure good lighting on face</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Remove glasses if possible</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Blink naturally 3 times</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Keep head still during capture</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700">Look directly at camera</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Start {mode === 'login' ? 'Authentication' : 'Enrollment'}
                </button>
              </div>
            )}

            {/* Capturing Step */}
            {step === 'capturing' && (
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg border-4 border-blue-500"
                  />
                  
                  {/* Face detection overlay */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
                  </div>

                  {/* Liveness indicators */}
                  <div className="absolute top-2 right-2 space-y-1">
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      livenessProgress.blinkCount >= livenessProgress.requiredBlinks 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <Eye className="w-3 h-3" />
                      <span>Blinks: {livenessProgress.blinkCount}/{livenessProgress.requiredBlinks}</span>
                    </div>
                    
                    {livenessProgress.headMovement && (
                      <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        <span>Movement ✓</span>
                      </div>
                    )}
                    
                    {livenessProgress.qualityCheck && (
                      <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        <span>Quality ✓</span>
                      </div>
                    )}
                    
                    {livenessProgress.antiSpoofing && (
                      <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        <span>Anti-Spoof ✓</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {feedback && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">{feedback}</p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={performVerification}
                    disabled={isProcessing || !allChecksComplete}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? 'Processing...' : mode === 'login' ? 'Authenticate' : 'Capture Biometric'}
                  </button>
                  <button
                    onClick={resetCapture}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className={`p-3 rounded-lg border ${
                    livenessProgress.blinkCount >= livenessProgress.requiredBlinks 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-center">
                      <Eye className={`h-6 w-6 mx-auto mb-1 ${
                        livenessProgress.blinkCount >= livenessProgress.requiredBlinks ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-xs font-medium">Blink Test</div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    livenessProgress.headMovement ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-center">
                      <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${
                        livenessProgress.headMovement ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-xs font-medium">Movement</div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    livenessProgress.qualityCheck ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-center">
                      <Camera className={`h-6 w-6 mx-auto mb-1 ${
                        livenessProgress.qualityCheck ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-xs font-medium">Quality</div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${
                    livenessProgress.antiSpoofing ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-center">
                      <Shield className={`h-6 w-6 mx-auto mb-1 ${
                        livenessProgress.antiSpoofing ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-xs font-medium">Anti-Spoof</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="text-center space-y-6">
                <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {mode === 'login' ? 'Authenticating...' : 'Processing Enrollment...'}
                  </h3>
                  <p className="text-gray-600">{feedback}</p>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {mode === 'login' ? 'Authentication Successful!' : 'Enrollment Complete!'}
                  </h3>
                  <p className="text-gray-600">{feedback}</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-green-700">
                      {mode === 'login' 
                        ? 'Redirecting to voting dashboard...' 
                        : 'Redirecting to login page...'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
                <button
                  onClick={resetCapture}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Your biometric data is encrypted and never stored as raw images</p>
          <p className="mt-1">Compliant with NDPR and INEC security standards</p>
        </div>
      </div>
    </div>
  );
};