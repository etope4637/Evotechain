import React, { useState } from 'react';
import { Shield, Eye, EyeOff, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { NINService } from '../../services/ninService';
import { AuditService } from '../../services/auditService';

interface NINLoginFormProps {
  onSuccess: (ninData: any) => void;
  onBack: () => void;
}

export const NINLoginForm: React.FC<NINLoginFormProps> = ({ onSuccess, onBack }) => {
  const [nin, setNin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isOnline] = useState(navigator.onLine);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      // Log NIN validation attempt
      await AuditService.logEvent(
        'voter',
        AuditService.ACTIONS.VOTER_NIN_VALIDATION,
        `NIN validation attempted: ${nin.slice(0, 3)}***${nin.slice(-2)}`,
        'pending',
        { isOnline },
        nin
      );

      const result = await NINService.validateNIN(nin, isOnline);
      
      if (result.valid && result.voterData) {
        // Log successful validation
        await AuditService.logEvent(
          'voter',
          AuditService.ACTIONS.VOTER_NIN_VALIDATION,
          `NIN validation successful: ${nin.slice(0, 3)}***${nin.slice(-2)}`,
          'success',
          { isOnline, voterData: result.voterData },
          nin
        );

        onSuccess({
          nin,
          ...result.voterData
        });
      } else {
        setError(result.error || 'NIN validation failed');
        
        // Log failed validation
        await AuditService.logEvent(
          'voter',
          AuditService.ACTIONS.VOTER_NIN_VALIDATION,
          `NIN validation failed: ${nin.slice(0, 3)}***${nin.slice(-2)} - ${result.error}`,
          'failure',
          { isOnline, error: result.error },
          nin
        );
      }
    } catch (error) {
      console.error('NIN validation error:', error);
      setError('System error during NIN validation. Please try again.');
      
      await AuditService.logEvent(
        'voter',
        AuditService.ACTIONS.VOTER_NIN_VALIDATION,
        `NIN validation system error: ${nin.slice(0, 3)}***${nin.slice(-2)}`,
        'failure',
        { isOnline, error: error.toString() },
        nin
      );
    }

    setIsValidating(false);
  };

  const formatNIN = (value: string) => {
    // Remove non-digits and limit to 11 characters
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits;
  };

  const handleNINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNIN(e.target.value);
    setNin(formatted);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voter Authentication</h1>
          <p className="text-gray-600">Enter your National Identification Number (NIN)</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-green-600 text-white p-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Secure NIN Verification</h3>
            <p className="text-green-100 text-sm">
              {isOnline ? 'Online verification via NIMC' : 'Offline verification via local registry'}
            </p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nin" className="block text-sm font-medium text-gray-700 mb-2">
                  National Identification Number (NIN)
                </label>
                <div className="relative">
                  <input
                    id="nin"
                    type="text"
                    required
                    value={nin}
                    onChange={handleNINChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-center text-lg font-mono tracking-wider"
                    placeholder="12345678901"
                    maxLength={11}
                    pattern="\d{11}"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {nin.length === 11 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="text-xs text-gray-500">{nin.length}/11</div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Your NIN is an 11-digit number issued by NIMC
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating || nin.length !== 11}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isValidating || nin.length !== 11
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isValidating ? 'Validating NIN...' : 'Verify & Continue'}
              </button>
            </form>

            {/* Demo NINs */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo NINs for Testing:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><code className="bg-blue-100 px-2 py-1 rounded">12345678901</code> - Adebayo Johnson (Lagos)</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded">12345678902</code> - Fatima Ibrahim (Kano)</p>
                <p><code className="bg-blue-100 px-2 py-1 rounded">12345678903</code> - Chinedu Okafor (Anambra)</p>
                <p className="text-xs text-blue-600 mt-2">
                  Note: If NIN is not found in voter database, you'll be redirected to registration.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                ← Back to Main Menu
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{isOnline ? 'Online - NIMC API Available' : 'Offline - Using Local Registry'}</span>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 Independent National Electoral Commission (INEC)</p>
          <p className="mt-1">Your NIN is encrypted and securely processed</p>
        </div>
      </div>
    </div>
  );
};