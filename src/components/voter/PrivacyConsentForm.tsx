import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, ArrowLeft, FileText, Eye, Database, Clock } from 'lucide-react';
import { PrivacyComplianceService } from '../../services/privacyComplianceService';
import { ConsentData } from '../../types/voter';

interface PrivacyConsentFormProps {
  onConsentGiven: (consentData: ConsentData) => void;
  onBack: () => void;
  nin: string;
}

export const PrivacyConsentForm: React.FC<PrivacyConsentFormProps> = ({
  onConsentGiven,
  onBack,
  nin
}) => {
  const [consents, setConsents] = useState({
    dataProcessingConsent: false,
    biometricConsent: false,
    storageConsent: false,
    auditConsent: false
  });
  
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [hasReadPolicy, setHasReadPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consentForm = PrivacyComplianceService.generateConsentForm();

  const handleConsentChange = (consentType: string, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [consentType]: value
    }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required consents
    const requiredConsents = ['dataProcessingConsent', 'biometricConsent', 'storageConsent'];
    const missingConsents = requiredConsents.filter(consent => !consents[consent as keyof typeof consents]);
    
    if (missingConsents.length > 0) {
      setError('Please provide all required consents to continue with registration.');
      return;
    }

    if (!hasReadPolicy) {
      setError('Please read the privacy policy before proceeding.');
      return;
    }

    // Create consent data
    const consentData: ConsentData = {
      dataProcessingConsent: consents.dataProcessingConsent,
      biometricConsent: consents.biometricConsent,
      storageConsent: consents.storageConsent,
      consentVersion: consentForm.version,
      consentDate: new Date(),
      ipAddress: 'localhost', // In production, get actual IP
      userAgent: navigator.userAgent
    };

    onConsentGiven(consentData);
  };

  const getConsentIcon = (category: string) => {
    switch (category) {
      case 'essential': return <Shield className="h-5 w-5" />;
      case 'biometric': return <Eye className="h-5 w-5" />;
      case 'storage': return <Database className="h-5 w-5" />;
      case 'audit': return <Clock className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (showPrivacyPolicy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">Privacy Policy</h1>
                  <p className="text-blue-100">Nigeria E-Voting System - NDPR Compliance</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Version {consentForm.version}</div>
                <div className="text-xs">Last Updated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="p-8 overflow-y-auto max-h-[70vh]">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {PrivacyComplianceService.getPrivacyPolicy()}
              </pre>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Consent
              </button>
              <button
                onClick={() => {
                  setHasReadPolicy(true);
                  setShowPrivacyPolicy(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                I Have Read This Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Privacy Consent</h1>
                <p className="text-blue-100">NDPR Compliance - Data Processing Agreement</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">NIN: {nin.slice(0, 3)}***{nin.slice(-2)}</div>
              <div className="text-xs">Consent Version: {consentForm.version}</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Your Privacy Rights Under NDPR
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  In compliance with the Nigeria Data Protection Regulation (NDPR) 2019, we require your 
                  explicit consent before processing your personal data for voter registration. Please review 
                  each consent carefully and indicate your agreement.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Consent Items */}
            <div className="space-y-4">
              {consentForm.notices.map((notice) => (
                <div key={notice.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      notice.category === 'essential' ? 'bg-red-100 text-red-600' :
                      notice.category === 'biometric' ? 'bg-purple-100 text-purple-600' :
                      notice.category === 'storage' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getConsentIcon(notice.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {notice.title}
                          {notice.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </h4>
                        {notice.required && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {notice.content}
                      </p>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consents[notice.id as keyof typeof consents]}
                          onChange={(e) => handleConsentChange(notice.id, e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          I consent to this data processing
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Policy */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Privacy Policy</h4>
                  <p className="text-gray-600 text-sm">
                    Please read our complete privacy policy to understand how we handle your data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Read Policy
                </button>
              </div>
              
              {hasReadPolicy && (
                <div className="mt-4 flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Privacy policy has been read</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to NIN Entry
              </button>
              
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
              >
                Accept & Continue to Registration
              </button>
            </div>
          </form>

          {/* Footer Notice */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              By proceeding, you acknowledge that you have read and understood our privacy practices 
              and consent to the processing of your personal data as described above.
            </p>
            <p className="mt-2">
              You may withdraw your consent at any time by contacting our Data Protection Officer at dpo@inec.gov.ng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};