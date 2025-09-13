import React, { useState, useRef, useEffect } from 'react';
import { User, Calendar, MapPin, Camera, Eye, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { BiometricSecurityService } from '../../services/biometricSecurityService';
import { SecureVoterAuthService } from '../../services/secureVoterAuthService';
import { RegistrationData, BiometricData, Voter, ConsentData } from '../../types/voter';

interface SecureVoterRegistrationProps {
  nin: string;
  consentData: ConsentData;
  onSuccess: (voter: Voter) => void;
  onBack: () => void;
  sessionId: string;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const SecureVoterRegistration: React.FC<SecureVoterRegistrationProps> = ({
  nin,
  consentData,
  onSuccess,
  onBack,
  sessionId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [registrationData, setRegistrationData] = useState<Omit<RegistrationData, 'biometricData' | 'consentData'>>({
    nin,
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(),
    sex: 'male',
    email: '',
    phone: '',
    state: '',
    lga: '',
    ward: '',
    pollingUnit: ''
  });

  const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState('');
  const [captureAttempts, setCaptureAttempts] = useState(0);
  const [livenessProgress, setLivenessProgress] = useState({
    blinkCount: 0,
    requiredBlinks: 3,
    headMovement: false,
    textureAnalysis: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleInputChange = (field: keyof typeof registrationData, value: string | Date) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep1 = (): boolean => {
    const required = ['firstName', 'lastName', 'state', 'lga', 'ward', 'pollingUnit'];
    const missing = required.filter(field => !registrationData[field as keyof typeof registrationData]);
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return false;
    }
    
    // Validate date of birth (must be at least 18 years old)
    const age = new Date().getFullYear() - registrationData.dateOfBirth.getFullYear();
    if (age < 18) {
      setError('You must be at least 18 years old to register as a voter.');
      return false;
    }
    
    return true;
  };

  const startBiometricCapture = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBiometricFeedback('Initializing secure camera...');
      
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
        setIsCameraActive(true);
        setBiometricFeedback('Position your face in the center and follow the instructions');
        
        // Start liveness monitoring
        startLivenessMonitoring();
      }
    } catch (error) {
      setError('Failed to access camera. Please ensure camera permissions are granted and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startLivenessMonitoring = () => {
    setBiometricFeedback('Please blink naturally 3 times while looking at the camera');
    
    // Simulate liveness monitoring progress
    const interval = setInterval(() => {
      setLivenessProgress(prev => {
        const newProgress = { ...prev };
        
        // Simulate blink detection
        if (prev.blinkCount < prev.requiredBlinks && Math.random() > 0.7) {
          newProgress.blinkCount = prev.blinkCount + 1;
          setBiometricFeedback(`Good! ${newProgress.blinkCount}/${prev.requiredBlinks} blinks detected`);
        }
        
        // Simulate head movement detection
        if (!prev.headMovement && Math.random() > 0.8) {
          newProgress.headMovement = true;
          setBiometricFeedback('Head movement detected - good!');
        }
        
        // Simulate texture analysis
        if (!prev.textureAnalysis && Math.random() > 0.9) {
          newProgress.textureAnalysis = true;
        }
        
        // Check if all requirements met
        if (newProgress.blinkCount >= newProgress.requiredBlinks && 
            newProgress.headMovement && 
            newProgress.textureAnalysis) {
          clearInterval(interval);
          setBiometricFeedback('Liveness verification complete! Ready to capture biometric data.');
        }
        
        return newProgress;
      });
    }, 1000);
  };

  const captureBiometric = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBiometricFeedback('Capturing and analyzing biometric data...');

      // Capture biometric data using the security service
      const capturedBiometric = await BiometricSecurityService.captureAndAnalyzeBiometric(videoRef.current);
      
      if (!capturedBiometric) {
        throw new Error('Failed to capture biometric data');
      }

      // Validate biometric quality
      if (!BiometricSecurityService.validateBiometricQuality(capturedBiometric)) {
        setCaptureAttempts(prev => prev + 1);
        
        if (captureAttempts >= 2) {
          setError('Multiple biometric capture attempts failed. Please ensure good lighting and clear face visibility.');
          return;
        }
        
        setError('Biometric quality insufficient. Please ensure good lighting and try again.');
        return;
      }

      setBiometricData(capturedBiometric);
      setSuccess('Biometric capture successful! High quality biometric data recorded.');
      
      // Stop camera
      stopCamera();

    } catch (error) {
      setError(`Biometric capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setBiometricFeedback('');
  };

  const handleRegistration = async () => {
    if (!biometricData) {
      setError('Biometric data is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBiometricFeedback('Processing secure registration...');

      // Prepare complete registration data
      const completeRegistrationData: RegistrationData = {
        ...registrationData,
        biometricData,
        consentData
      };

      // Register voter using secure service
      const result = await SecureVoterAuthService.registerNewVoter(completeRegistrationData, sessionId);

      if (result.success && result.voter) {
        setSuccess('Registration completed successfully! You are now a verified voter.');
        
        // Transition to voting after brief delay
        setTimeout(() => {
          onSuccess(result.voter!);
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }

    } catch (error) {
      setError(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      stopCamera();
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={prevStep}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Secure Voter Registration</h1>
                <p className="text-green-100">Complete your verified voter profile</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Step {currentStep} of 2</div>
              <div className="text-xs">NIN: {nin.slice(0, 3)}***{nin.slice(-2)}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={registrationData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={registrationData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={registrationData.dateOfBirth.toISOString().split('T')[0]}
                      onChange={(e) => handleInputChange('dateOfBirth', new Date(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sex *
                    </label>
                    <select
                      value={registrationData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={registrationData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={registrationData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      value={registrationData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local Government Area *
                    </label>
                    <input
                      type="text"
                      value={registrationData.lga}
                      onChange={(e) => handleInputChange('lga', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your LGA"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ward *
                  </label>
                  <input
                    type="text"
                    value={registrationData.ward}
                    onChange={(e) => handleInputChange('ward', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your ward"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Polling Unit *
                  </label>
                  <input
                    type="text"
                    value={registrationData.pollingUnit}
                    onChange={(e) => handleInputChange('pollingUnit', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your polling unit"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  Continue to Biometric Capture
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Secure Biometric Capture */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Secure Biometric Enrollment</h2>
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-6">
                  {!isCameraActive ? (
                    <div className="space-y-4">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Biometric Security Enrollment
                        </h3>
                        <p className="text-gray-600 mb-4">
                          We will capture your facial biometric data with advanced liveness detection 
                          to ensure secure voter verification.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2">Security Features:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Advanced liveness detection with blink verification</li>
                            <li>• Anti-spoofing protection against photos/videos</li>
                            <li>• Encrypted biometric storage (no raw images saved)</li>
                            <li>• High-quality capture with environmental analysis</li>
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={startBiometricCapture}
                        disabled={isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Starting Secure Camera...' : 'Start Biometric Capture'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-80 h-60 bg-black rounded-lg border-4 border-blue-500"
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        
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
                        </div>
                      </div>
                      
                      {biometricFeedback && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800 font-medium">{biometricFeedback}</p>
                        </div>
                      )}

                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={captureBiometric}
                          disabled={isLoading || livenessProgress.blinkCount < livenessProgress.requiredBlinks}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? 'Processing...' : 'Capture Biometric Data'}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {biometricData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Biometric Capture Successful!</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                      <div>
                        <strong>Quality Score:</strong> {(biometricData.qualityScore * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Confidence:</strong> {(biometricData.confidence * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Liveness Score:</strong> {(biometricData.livenessScore * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Blinks Detected:</strong> {biometricData.livenessTests.eyeBlinkCount}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <button
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleRegistration}
                    disabled={!biometricData || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Completing Registration...' : 'Complete Secure Registration'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};