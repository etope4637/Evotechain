import React, { useState } from 'react';
import { User, CreditCard, AlertCircle, CheckCircle, ArrowLeft, Calendar, MapPin } from 'lucide-react';

interface VoterRegisterProps {
  onNavigate: (view: string) => void;
  onRegisterSuccess: (registrationData: any) => void;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const VoterRegister: React.FC<VoterRegisterProps> = ({ onNavigate, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    nin: '',
    firstName: '',
    lastName: '',
    sex: 'male' as 'male' | 'female',
    dateOfBirth: '',
    state: '',
    lga: '',
    ward: '',
    pollingUnit: ''
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [validationStep, setValidationStep] = useState<'nin' | 'form'>('nin');

  const handleNINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      // Simulate NIN validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if NIN is already registered
      const registeredNINs = ['12345678901', '12345678902', '12345678903'];
      
      if (registeredNINs.includes(formData.nin)) {
        setError('This NIN is already registered. Please use the login option instead.');
        return;
      }
      
      // Validate NIN format
      if (formData.nin.length !== 11) {
        setError('Invalid NIN format. NIN must be 11 digits.');
        return;
      }

      // NIN is valid and not registered - proceed to form
      setValidationStep('form');
    } catch (error) {
      setError('System error during NIN validation. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'state', 'lga', 'ward', 'pollingUnit'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate age (must be 18+)
      const birthDate = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        setError('You must be at least 18 years old to register as a voter.');
        return;
      }

      // Simulate registration processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onRegisterSuccess(formData);
    } catch (error) {
      setError('System error during registration. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, nin: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('voter-portal')}
            className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Portal</span>
          </button>
          
          <div className="bg-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voter Registration</h1>
          <p className="text-gray-600">Create your secure voting account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {validationStep === 'nin' ? 'NIN Verification' : 'Personal Information'}
                </h3>
                <p className="text-green-100 text-sm">
                  {validationStep === 'nin' ? 'Verify your National ID' : 'Complete your profile'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Step {validationStep === 'nin' ? '1' : '2'} of 3</div>
                <div className="text-xs">Registration Process</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: validationStep === 'nin' ? '33%' : '66%' }}
            />
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: NIN Verification */}
            {validationStep === 'nin' && (
              <form onSubmit={handleNINSubmit} className="space-y-6">
                <div>
                  <label htmlFor="nin" className="block text-sm font-medium text-gray-700 mb-2">
                    National Identification Number (NIN) *
                  </label>
                  <div className="relative">
                    <input
                      id="nin"
                      type="text"
                      required
                      value={formData.nin}
                      onChange={handleNINChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-center text-lg font-mono tracking-wider ${
                        formData.nin.length === 0 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : formData.nin.length === 11
                            ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                            : 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500'
                      }`}
                      placeholder="Enter 11-digit NIN"
                      maxLength={11}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {formData.nin.length === 11 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="text-xs text-gray-500">{formData.nin.length}/11</div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Your NIN is an 11-digit number issued by NIMC
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isValidating || formData.nin.length !== 11}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isValidating || formData.nin.length !== 11
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  {isValidating ? 'Validating NIN...' : 'Verify NIN & Continue'}
                </button>

                {/* Demo Notice */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Demo Mode:</h4>
                  <p className="text-sm text-yellow-800">
                    Use any 11-digit NIN except 12345678901, 12345678902, or 12345678903 
                    (these are already registered for login testing).
                  </p>
                </div>
              </form>
            )}

            {/* Step 2: Personal Information Form */}
            {validationStep === 'form' && (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sex *
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local Government Area (LGA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lga}
                      onChange={(e) => handleInputChange('lga', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your LGA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ward *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ward}
                      onChange={(e) => handleInputChange('ward', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your ward"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Polling Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pollingUnit}
                    onChange={(e) => handleInputChange('pollingUnit', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your polling unit"
                  />
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setValidationStep('nin')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to NIN
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    {isValidating ? 'Processing...' : 'Continue to Biometric Capture'}
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => onNavigate('voter-login')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Login here
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