import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, Eye, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { BiometricService } from '../../services/biometricService';
import { VoterAuthService } from '../../services/voterAuthService';
import { AuditService } from '../../services/auditService';
import { StorageService } from '../../services/storageService';
import { NINLoginForm } from './NINLoginForm';
import { VoterRegistration } from './VoterRegistration';
import type { BiometricData, Vote, Election, Candidate } from '../../types';

interface VoterInterfaceProps {
  elections: Election[];
  onVoteSubmitted: (vote: Vote) => void;
}

type AuthStep = 'nin-login' | 'biometric-auth' | 'registration' | 'voting' | 'receipt';

interface AuthState {
  step: AuthStep;
  nin?: string;
  voterData?: any;
  biometricData?: BiometricData;
  isAuthenticated: boolean;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export function VoterInterface({ elections, onVoteSubmitted }: VoterInterfaceProps) {
  const [authState, setAuthState] = useState<AuthState>({
    step: 'nin-login',
    isAuthenticated: false,
    attempts: 0,
    maxAttempts: 5
  });
  
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [livenessStep, setLivenessStep] = useState<'instructions' | 'capturing' | 'processing'>('instructions');
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  
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
    };
  }, []);

  const handleNINSubmit = async (ninData: any) => {
    setIsProcessing(true);
    setAuthState(prev => ({ ...prev, error: undefined }));

    try {
      const result = await VoterAuthService.verifyNIN(ninData.nin);
      
      if (result.exists) {
        setAuthState(prev => ({
          ...prev,
          step: 'biometric-auth',
          nin: ninData.nin,
          voterData: result.voterData
        }));
      } else {
        // NIN not found in database - redirect to registration
        setAuthState(prev => ({
          ...prev,
          step: 'registration',
          nin: ninData.nin,
          voterData: ninData // Pass the NIN data for registration
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to verify NIN. Please try again.',
        attempts: prev.attempts + 1
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const startBiometricCapture = async () => {
    try {
      setLivenessStep('instructions');
      const stream = await navigator.mediaDevices.getUserMedia(
        BiometricService.getWebcamConstraints()
      );
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setLivenessStep('capturing');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Camera access denied. Please allow camera access to continue.'
      }));
    }
  };

  const performBiometricAuth = async () => {
    if (!videoRef.current || !authState.nin) return;

    setIsProcessing(true);
    setLivenessStep('processing');

    try {
      const biometricData = await BiometricService.captureAndAnalyze(videoRef.current);
      
      if (!biometricData) {
        throw new Error('Failed to capture biometric data');
      }

      const authResult = await VoterAuthService.authenticateBiometric(
        authState.nin,
        biometricData
      );

      if (authResult.success) {
        setAuthState(prev => ({
          ...prev,
          step: 'voting',
          isAuthenticated: true,
          biometricData
        }));
        
        await AuditService.logEvent('VOTER_AUTHENTICATED', {
          nin: authState.nin,
          confidence: biometricData.confidence,
          livenessScore: biometricData.livenessScore
        });
      } else {
        if (authResult.shouldRegister) {
          setAuthState(prev => ({
            ...prev,
            step: 'registration',
            biometricData
          }));
        } else {
          throw new Error(authResult.message || 'Biometric authentication failed');
        }
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication failed',
        attempts: prev.attempts + 1
      }));
    } finally {
      setIsProcessing(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLivenessStep('instructions');
    setBlinkDetected(false);
  };

  const handleRegistrationComplete = (voterData: any) => {
    setAuthState(prev => ({
      ...prev,
      step: 'voting',
      isAuthenticated: true,
      voterData
    }));
  };

  const handleVoteSelection = (electionId: string, candidateId: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [electionId]: candidateId
    }));
  };

  const submitVotes = async () => {
    if (!authState.nin || !authState.isAuthenticated) return;

    setIsProcessing(true);

    try {
      const votes: Vote[] = await Promise.all(Object.entries(selectedVotes).map(async ([electionId, candidateId]) => ({
        id: crypto.randomUUID(),
        electionId,
        candidateId,
        voterNIN: authState.nin!,
        timestamp: new Date(),
        biometricHash: authState.biometricData ? 
          await BiometricService.generateBiometricHash(authState.biometricData.faceEmbedding) : '',
        isOffline: !isOnline
      })));

      for (const vote of votes) {
        await StorageService.storeVote(vote);
        onVoteSubmitted(vote);
        
        await AuditService.logEvent('VOTE_CAST', {
          voteId: vote.id,
          electionId: vote.electionId,
          voterNIN: vote.voterNIN,
          isOffline: vote.isOffline
        });
      }

      // Generate receipt
      const receiptData = {
        votes,
        timestamp: new Date(),
        voterNIN: authState.nin,
        receiptId: crypto.randomUUID()
      };
      
      const receiptHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(receiptData))
      );
      
      const receiptString = Array.from(new Uint8Array(receiptHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      setReceipt(receiptString);
      setAuthState(prev => ({ ...prev, step: 'receipt' }));

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to submit votes. Please try again.'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAuth = () => {
    setAuthState({
      step: 'nin-login',
      isAuthenticated: false,
      attempts: 0,
      maxAttempts: 5
    });
    setSelectedVotes({});
    setReceipt(null);
    stopCamera();
  };

  if (authState.attempts >= authState.maxAttempts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Locked</h2>
          <p className="text-gray-600 mb-6">
            Too many failed attempts. Please contact election officials for assistance.
          </p>
          <button
            onClick={resetAuth}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {authState.step === 'nin-login' && (
          <NINLoginForm
            onSuccess={handleNINSubmit}
            isLoading={isProcessing}
            error={authState.error}
            attempts={authState.attempts}
            maxAttempts={authState.maxAttempts}
          />
        )}

        {authState.step === 'biometric-auth' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <Eye className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Biometric Verification</h2>
                <p className="text-gray-600">
                  Please complete the liveness check to verify your identity
                </p>
              </div>

              {livenessStep === 'instructions' && (
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Instructions</h3>
                    <ul className="text-blue-700 space-y-2 text-left">
                      <li>• Position your face in the center of the camera</li>
                      <li>• Ensure good lighting on your face</li>
                      <li>• You will be asked to blink naturally</li>
                      <li>• Keep your head still during capture</li>
                    </ul>
                  </div>
                  <button
                    onClick={startBiometricCapture}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Verification
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
                      className="w-full max-w-md mx-auto rounded-lg border-4 border-green-500"
                    />
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-500"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-500"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-500"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 font-medium">
                      Please blink naturally when ready, then click capture
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={performBiometricAuth}
                      disabled={isProcessing}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Capture & Verify'}
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
                  <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing biometric data...</p>
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
            </div>
          </div>
        )}

        {authState.step === 'registration' && (
          <VoterRegistration
            ninData={{ 
              nin: authState.nin!,
              firstName: authState.voterData?.firstName || '',
              lastName: authState.voterData?.lastName || '',
              dateOfBirth: authState.voterData?.dateOfBirth || '',
              state: authState.voterData?.state || '',
              lga: authState.voterData?.lga || ''
            }}
            biometricData={authState.biometricData}
            onSuccess={handleRegistrationComplete}
            onBack={resetAuth}
          />
        )}

        {authState.step === 'voting' && authState.isAuthenticated && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Cast Your Vote</h2>
                <p className="text-gray-600">
                  Select your preferred candidates for each election
                </p>
              </div>

              <div className="space-y-8">
                {elections.map((election) => (
                  <div key={election.id} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{election.title}</h3>
                    <p className="text-gray-600 mb-6">{election.description}</p>
                    
                    <div className="grid gap-4">
                      {election.candidates.map((candidate) => (
                        <label
                          key={candidate.id}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedVotes[election.id] === candidate.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`election-${election.id}`}
                            value={candidate.id}
                            checked={selectedVotes[election.id] === candidate.id}
                            onChange={() => handleVoteSelection(election.id, candidate.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                            selectedVotes[election.id] === candidate.id
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedVotes[election.id] === candidate.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{candidate.name}</div>
                            <div className="text-sm text-gray-600">{candidate.party}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4 justify-center">
                <button
                  onClick={submitVotes}
                  disabled={isProcessing || Object.keys(selectedVotes).length === 0}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Votes'}
                </button>
                <button
                  onClick={resetAuth}
                  className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {authState.step === 'receipt' && receipt && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Vote Submitted Successfully</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Receipt</h3>
                <div className="font-mono text-sm bg-white p-4 rounded border break-all">
                  {receipt}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Save this receipt to verify your vote later
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigator.clipboard.writeText(receipt)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Receipt
                </button>
                <button
                  onClick={resetAuth}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}