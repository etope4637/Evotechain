import React, { useState } from 'react';
import { Shield, CreditCard, AlertCircle, CheckCircle, Wifi, WifiOff, Lock } from 'lucide-react';
import { AuditSecurityService } from '../../services/auditSecurityService';

interface SecureNINLoginFormProps {
  onSuccess: (nin: string) => void;
  isLoading: boolean;
  error?: string;
  isOnline: boolean;
}

export const SecureNINLoginForm: React.FC<SecureNINLoginFormProps> = ({ 
  onSuccess, 
  isLoading, 
  error, 
  isOnline 
}) => {
  const [nin, setNin] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidFormat) {
      return;
    }

    // Log login attempt
    await AuditSecurityService.logEvent({
      eventType: 'login_attempt',
      result: 'pending',
      details: `NIN login attempt initiated`,
      sessionId: crypto.randomUUID(),
      metadata: { 
        nin_format_valid: isValidFormat,
        connection_status: isOnline ? 'online' : 'offline'
      }
    });

    onSuccess(nin);
  };

  const handleNINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setNin(value);
    setIsValidFormat(value.length === 11);
  };

  const formatNINDisplay = (value: string) => {
    // Format as XXX-XXXX-XXXX for better readability
    if (value.length <= 3) return value;
    if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Voter Login</h1>
          <p className="text-gray-600">Enter your National Identification Number (NIN)</p>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your NIN is encrypted and securely processed. This system uses advanced biometric 
                authentication and blockchain technology to ensure electoral integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 text-center">
            <Lock className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Secure NIN Verification</h3>
            <div className="flex items-center justify-center space-x-2 mt-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Online - NIMC API Available</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline - Local Registry</span>
                </>
              )}
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nin" className="block text-sm font-medium text-gray-700 mb-2">
                  National Identification Number (NIN) *
                </label>
                <div className="relative">
                  <input
                    id="nin"
                    type="text"
                    required
                    value={nin}
                    onChange={handleNINChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-center text-lg font-mono tracking-wider ${
                      nin.length === 0 
                        ? 'border-gray-300 focus:ring-blue-500' 
                        : isValidFormat 
                          ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                          : 'border-red-300 bg-red-50 focus:ring-red-500'
                    }`}
                    placeholder="Enter 11-digit NIN"
                    maxLength={11}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {nin.length === 0 ? (
                      <div className="text-xs text-gray-500">0/11</div>
                    ) : isValidFormat ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="text-xs text-red-500">{nin.length}/11</div>
                    )}
                  </div>
                </div>
                
                {nin.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Format: {formatNINDisplay(nin)}
                  </div>
                )}
                
                <p className="text-xs text-gray-600 mt-2">
                  Your NIN is an 11-digit number issued by the National Identity Management Commission (NIMC)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isValidFormat}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLoading || !isValidFormat
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validating NIN...</span>
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            {/* Demo NINs */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo NINs for Testing:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between items-center">
                  <code className="bg-blue-100 px-2 py-1 rounded">12345678901</code>
                  <button
                    onClick={() => {
                      setNin('12345678901');
                      setIsValidFormat(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-blue-100 px-2 py-1 rounded">12345678902</code>
                  <button
                    onClick={() => {
                      setNin('12345678902');
                      setIsValidFormat(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-blue-100 px-2 py-1 rounded">99999999999</code>
                  <button
                    onClick={() => {
                      setNin('99999999999');
                      setIsValidFormat(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use (New Registration)
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  First two are registered voters, last one will trigger new registration flow.
                </p>
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-6 text-center">
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                <div className="flex flex-col items-center">
                  <Shield className="h-4 w-4 mb-1" />
                  <span>Encrypted</span>
                </div>
                <div className="flex flex-col items-center">
                  <Lock className="h-4 w-4 mb-1" />
                  <span>Secure</span>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-4 w-4 mb-1" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 Independent National Electoral Commission (INEC)</p>
          <p className="mt-1">Secure • Transparent • Democratic</p>
        </div>
      </div>
    </div>
  );
};