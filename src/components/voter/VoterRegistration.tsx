import React, { useState, useRef, useEffect } from 'react';
import { User, Calendar, MapPin, Camera, Eye, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { BiometricService } from '../../services/biometricService';
import { VoterAuthService } from '../../services/voterAuthService';
import { AuditService } from '../../services/auditService';

interface VoterRegistrationProps {
  ninData: { nin: string };
  onSuccess: (voterData: any) => void;
  onBack: () => void;
}

interface RegistrationData {
  nin: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'male' | 'female';
  email?: string;
  phone?: string;
  stateOfRegistration: string;
  lga: string;
  ward: string;
  pollingUnit: string;
}

interface BiometricData {
  faceEmbedding: number[];
  livenessScore: number;
  eyeBlinkCount: number;
  eyeAspectRatio: number[];
  blinkDuration: number[];
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const VoterRegistration: React.FC<VoterRegistrationProps> = ({
  ninData,
  onSuccess,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    nin: ninData.nin,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'male',
    email: '',
    phone: '',
    stateOfRegistration: '',
    lga: '',
    ward: '',
    pollingUnit: ''
  });

  const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [livenessCheck, setLivenessCheck] = useState({
    isActive: false,
    blinkCount: 0,
    requiredBlinks: 3,
    instruction: 'Position your face in the camera and blink naturally'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep1 = (): boolean => {
    const required = ['firstName', 'lastName', 'dateOfBirth', 'stateOfRegistration', 'lga', 'ward', 'pollingUnit'];
    const missing = required.filter(field => !registrationData[field as keyof RegistrationData]);
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const startBiometricCapture = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setLivenessCheck(prev => ({ ...prev, isActive: true }));
      }
    } catch (error) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsLoading(false);
    }
  };

  const captureBiometric = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Capture frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert to blob for processing
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      // Process biometric data with liveness detection
      const biometricResult = await BiometricService.processBiometricData(blob);
      
      if (!biometricResult.isLive) {
        setError('Liveness check failed. Please ensure you are looking at the camera and blink naturally.');
        return;
      }

      if (biometricResult.blinkCount < livenessCheck.requiredBlinks) {
        setError(`Please blink ${livenessCheck.requiredBlinks - biometricResult.blinkCount} more times`);
        setLivenessCheck(prev => ({ 
          ...prev, 
          blinkCount: biometricResult.blinkCount,
          instruction: `Blink ${livenessCheck.requiredBlinks - biometricResult.blinkCount} more times`
        }));
        return;
      }

      setBiometricData({
        faceEmbedding: biometricResult.faceEmbedding,
        livenessScore: biometricResult.livenessScore,
        eyeBlinkCount: biometricResult.blinkCount,
        eyeAspectRatio: biometricResult.eyeAspectRatios,
        blinkDuration: biometricResult.blinkDuration
      });

      setSuccess('Biometric capture successful!');
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);

    } catch (error) {
      setError(`Biometric capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!biometricData) {
      setError('Biometric data is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Register voter with complete data
      const voterData = await VoterAuthService.registerVoter({
        ...registrationData,
        biometricData
      });

      // Log registration event
      await AuditService.logEvent({
        type: 'voter_registration',
        userId: voterData.id,
        details: {
          nin: registrationData.nin,
          registrationLocation: `${registrationData.stateOfRegistration}, ${registrationData.lga}, ${registrationData.ward}`,
          biometricCaptured: true,
          livenessScore: biometricData.livenessScore
        },
        timestamp: new Date()
      });

      setSuccess('Registration completed successfully!');
      
      // Call onSuccess callback
      setTimeout(() => {
        onSuccess(voterData);
      }, 2000);

    } catch (error) {
      setError(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log failed registration
      await AuditService.logEvent({
        type: 'voter_registration_failed',
        userId: registrationData.nin,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          step: 'final_registration'
        },
        timestamp: new Date()
      });
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
                <h1 className="text-2xl font-bold">Voter Registration</h1>
                <p className="text-green-100">Complete your voter profile</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Step {currentStep} of 2</div>
              <div className="text-xs">NIN: {ninData.nin}</div>
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
                      value={registrationData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
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
                      State of Registration *
                    </label>
                    <select
                      value={registrationData.stateOfRegistration}
                      onChange={(e) => handleInputChange('stateOfRegistration', e.target.value)}
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

          {/* Step 2: Biometric Capture */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Camera className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Biometric Capture</h2>
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-6">
                  {!isCameraActive ? (
                    <div className="space-y-4">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                      <p className="text-gray-600">
                        We need to capture your facial biometric data for secure voter verification.
                      </p>
                      <button
                        onClick={startBiometricCapture}
                        disabled={isLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Starting Camera...' : 'Start Camera'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-80 h-60 bg-black rounded-lg"
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                      </div>
                      
                      {livenessCheck.isActive && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Liveness Check</span>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">{livenessCheck.instruction}</p>
                          <div className="text-xs text-blue-600">
                            Blinks detected: {livenessCheck.blinkCount} / {livenessCheck.requiredBlinks}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={captureBiometric}
                        disabled={isLoading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Capture Biometric'}
                      </button>
                    </div>
                  )}
                </div>

                {biometricData && (
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Biometric capture successful!</p>
                    <p className="text-sm text-green-700">
                      Liveness Score: {(biometricData.livenessScore * 100).toFixed(1)}%
                    </p>
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
                    {isLoading ? 'Registering...' : 'Complete Registration'}
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