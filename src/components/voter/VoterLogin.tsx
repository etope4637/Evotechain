import React, { useState } from 'react';
import { Shield, CreditCard, AlertCircle, CheckCircle, ArrowLeft, Eye } from 'lucide-react';

interface VoterLoginProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (nin: string) => void;
}

export const VoterLogin: React.FC<VoterLoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [nin, setNin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      // Simulate NIN validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if NIN exists in demo data
      const demoNINs = ['12345678901', '12345678902', '12345678903'];
      
      if (demoNINs.includes(nin)) {
        onLoginSuccess(nin);
      } else {
        setError('NIN not found. Please check your NIN or register as a new voter.');
      }
    } catch (error) {
      setError('System error during NIN validation. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleNINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setNin(value);
    setError('');
  };

  const formatNINDisplay = (value: string) => {
    if (value.length <= 3) return value;
    if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('voter-portal')}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Portal</span>
          </button>
          
          <div className="bg-blue-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voter Login</h1>
          <p className="text-gray-600">Enter your NIN to access your voting account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Secure NIN Authentication</h3>
            <p className="text-blue-100 text-sm">Your NIN is encrypted and securely processed</p>
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
                        : nin.length === 11
                          ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                          : 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500'
                    }`}
                    placeholder="Enter 11-digit NIN"
                    maxLength={11}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {nin.length === 0 ? (
                      <div className="text-xs text-gray-500">0/11</div>
                    ) : nin.length === 11 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="text-xs text-yellow-600">{nin.length}/11</div>
                    )}
                  </div>
                </div>
                
                {nin.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Format: {formatNINDisplay(nin)}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating || nin.length !== 11}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isValidating || nin.length !== 11
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                {isValidating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validating NIN...</span>
                  </div>
                ) : (
                  'Continue to Biometric Verification'
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
                    onClick={() => setNin('12345678901')}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-blue-100 px-2 py-1 rounded">12345678902</code>
                  <button
                    onClick={() => setNin('12345678902')}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <code className="bg-blue-100 px-2 py-1 rounded">12345678903</code>
                  <button
                    onClick={() => setNin('12345678903')}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('voter-register')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Register as a new voter
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 Independent National Electoral Commission (INEC)</p>
          <p className="mt-1">Your data is encrypted and securely processed</p>
        </div>
      </div>
    </div>
  );
};