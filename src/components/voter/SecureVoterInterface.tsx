import React, { useState, useEffect, useRef } from 'react';
import { Camera, Shield, CheckCircle, XCircle, Eye, AlertTriangle, Wifi, WifiOff, Lock, User } from 'lucide-react';
import { SecureVoterAuthService } from '../../services/secureVoterAuthService';
import { BiometricSecurityService } from '../../services/biometricSecurityService';
import { PrivacyComplianceService } from '../../services/privacyComplianceService';
import { AuditSecurityService } from '../../services/auditSecurityService';
import { SecureNINLoginForm } from './SecureNINLoginForm';
import { SecureVoterRegistration } from './SecureVoterRegistration';
import { PrivacyConsentForm } from './PrivacyConsentForm';
import type { BiometricData, AuthenticationResult, Voter } from '../../types/voter';

type AuthStep = 'nin-login' | 'biometric-auth' | 'registration' | 'consent' | 'voting' | 'receipt';

interface AuthState {
  step: AuthStep;
  nin?: string;
  voter?: Voter;
  biometricData?: BiometricData;
  isAuthenticated: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockoutTime?: Date;
  sessionId: string;
}

interface VoterInterfaceProps {
  onNavigate: (view: string) => void;
}

export const SecureVoterInterface: React.FC<VoterInterfaceProps> = ({ onNavigate }) => {
  const [authState, setAuthState] = useState<AuthState>({
    step: 'nin-login',
    isAuthenticated: false,
    sessionId: crypto.randomUUID()
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [livenessStep, setLivenessStep] = useState<'instructions' | 'capturing' | 'processing'>('instructions');
  const [biometricFeedback, setBiometricFeedback] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopCamera();
    };
  }, []);

  /**
   * Step 1: Handle NIN submission and validation
   */
  const handleNINSubmit = async (nin: string) => {
    setIsProcessing(true);
    setAuthState(prev => ({ ...prev, error: undefined }));

    try {
      const result = await SecureVoterAuthService.validateNINAndCheckRegistration(nin, authState.sessionId);
      
      if (result.success) {
        if (result.requiresRegistration) {
          // NIN valid but voter not registered - go to consent then registration
          setAuthState(prev => ({
            ...prev,
            step: 'consent',
            nin,
            error: undefined
          }));
        } else if (result.voter) {
          // Voter found - proceed to biometric authentication
          setAuthState(prev => ({
            ...prev,
            step: 'biometric-auth',
            nin,
            voter: result.voter,
            attemptsRemaining: result.attemptsRemaining,
            error: undefined
          }));
        }
      } else {
        // Handle various error cases
        setAuthState(prev => ({
          ...prev,
          error: result.error,
          lockoutTime: result.lockoutTime
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'System error during NIN validation. Please try again.'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 2: Handle privacy consent
   */
  const handleConsentGiven = (consentData: any) => {
    setAuthState(prev => ({
      ...prev,
      step: 'registration',
      consentData
    }));
  };

  /**
   * Step 3: Start biometric capture for authentication
   */
  const startBiometricCapture = async () => {
    try {
      setLivenessStep('instructions');
      setBiometricFeedback('Initializing camera...');
      
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
        setLivenessStep('capturing');
        setBiometricFeedback('Position your face in the center and blink naturally');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Camera access denied. Please allow camera access to continue.'
      }));
    }
  };

  /**
   * Step 4: Perform biometric authentication
   */
  const performBiometricAuth = async () => {
    if (!videoRef.current || !authState.voter) return;

    setIsProcessing(true);
    setLivenessStep('processing');
    setBiometricFeedback('Analyzing biometric data...');

    try {
      const biometricData = await BiometricSecurityService.captureAndAnalyzeBiometric(videoRef.current);
      
      if (!biometricData) {
        throw new Error('Failed to capture biometric data');
      }

      setBiometricFeedback('Verifying identity...');
      
      const authResult = await SecureVoterAuthService.authenticateWithBiometrics(
        authState.voter,
        biometricData,
        authState.sessionId
      );

      if (authResult.success) {
        setAuthState(prev => ({
          ...prev,
          step: 'voting',
          isAuthenticated: true,
          biometricData,
          error: undefined
        }));
        
        setBiometricFeedback('Authentication successful!');
      } else {
        setAuthState(prev => ({
          ...prev,
          error: authResult.error,
          attemptsRemaining: authResult.attemptsRemaining
        }));
        
        setBiometricFeedback('Authentication failed. Please try again.');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
      
      setBiometricFeedback('Error during authentication');
    } finally {
      setIsProcessing(false);
      stopCamera();
    }
  };

  /**
   * Handle successful registration
   */
  const handleRegistrationComplete = (voter: Voter) => {
    setAuthState(prev => ({
      ...prev,
      step: 'voting',
      isAuthenticated: true,
      voter
    }));
  };

  /**
   * Stop camera and cleanup
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLivenessStep('instructions');
    setBiometricFeedback('');
  };

  /**
   * Reset authentication state
   */
  const resetAuth = () => {
    setAuthState({
      step: 'nin-login',
      isAuthenticated: false,
      sessionId: crypto.randomUUID()
    });
    stopCamera();
  };

  // Handle account lockout
  if (authState.lockoutTime && new Date() < authState.lockoutTime) {
    const remainingTime = Math.ceil((authState.lockoutTime.getTime() - Date.now()) / 60000);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Temporarily Locked</h2>
          <p className="text-gray-600 mb-6">
            Too many failed attempts. Please wait {remainingTime} minutes before trying again.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              For security purposes, accounts are temporarily locked after multiple failed authentication attempts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Contact Election Officials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Security Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Secure E-Voting System</span>
            </div>
            <div className="text-xs text-gray-500">
              Session: {authState.sessionId.slice(0, 8)}...
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <button
              onClick={() => onNavigate('admin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 container mx-auto px-4 py-8">
        {/* Step 1: NIN Login */}
        {authState.step === 'nin-login' && (
          <SecureNINLoginForm
            onSuccess={handleNINSubmit}
            isLoading={isProcessing}
            error={authState.error}
            isOnline={isOnline}
          />
        )}

        {/* Step 2: Privacy Consent */}
        {authState.step === 'consent' && (
          <PrivacyConsentForm
            onConsentGiven={handleConsentGiven}
            onBack={resetAuth}
            nin={authState.nin!}
          />
        )}

        {/* Step 3: Biometric Authentication */}
        {authState.step === 'biometric-auth' && authState.voter && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <Eye className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Biometric Authentication</h2>
                <p className="text-gray-600">
                  Welcome back, {authState.voter.firstName} {authState.voter.lastName}
                </p>
                {authState.attemptsRemaining !== undefined && (
                  <p className="text-sm text-orange-600 mt-2">
                    {authState.attemptsRemaining} attempts remaining
                  </p>
                )}
              </div>

              {livenessStep === 'instructions' && (
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Authentication Instructions</h3>
                    <ul className="text-blue-700 space-y-2 text-left">
                      <li>• Position your face clearly in the camera frame</li>
                      <li>• Ensure good lighting on your face</li>
                      <li>• Blink naturally 2-3 times during capture</li>
                      <li>• Keep your head still and look directly at the camera</li>
                      <li>• Remove glasses or face coverings if possible</li>
                    </ul>
                  </div>
                  <button
                    onClick={startBiometricCapture}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Authentication
                  </button>
                </div>
              )}

              {livenessStep === 'capturing' && (
                <div className="text-center">
                  <div className="relative mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg border-4 border-blue-500"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      {/* Face detection overlay */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
                    </div>
                  </div>
                  
                  {biometricFeedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 font-medium">{biometricFeedback}</p>
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={performBiometricAuth}
                      disabled={isProcessing}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? 'Authenticating...' : 'Authenticate'}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {livenessStep === 'processing' && (
                <div className="text-center">
                  <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">{biometricFeedback}</p>
                </div>
              )}

              {authState.error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{authState.error}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={resetAuth}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  ← Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Voter Registration */}
        {authState.step === 'registration' && (
          <SecureVoterRegistration
            nin={authState.nin!}
            consentData={authState.consentData}
            onSuccess={handleRegistrationComplete}
            onBack={resetAuth}
            sessionId={authState.sessionId}
          />
        )}

        {/* Step 5: Voting Interface */}
        {authState.step === 'voting' && authState.isAuthenticated && authState.voter && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Voting</h2>
                <p className="text-gray-600">
                  Authentication successful. You can now cast your vote.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-green-700">
                    <strong>Voter:</strong> {authState.voter.firstName} {authState.voter.lastName}<br />
                    <strong>Location:</strong> {authState.voter.state}, {authState.voter.lga}<br />
                    <strong>Polling Unit:</strong> {authState.voter.pollingUnit}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Voting interface will be implemented here with available elections.
                </p>
                <button
                  onClick={resetAuth}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Voting Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};