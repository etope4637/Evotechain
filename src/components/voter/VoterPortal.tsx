import React, { useState } from 'react';
import { Vote, Shield, Users, ArrowLeft } from 'lucide-react';

interface VoterPortalProps {
  onNavigate: (view: string) => void;
}

export const VoterPortal: React.FC<VoterPortalProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('landing')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="bg-green-600 p-2 rounded-lg">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Voter Portal</h1>
                <p className="text-xs text-gray-600">Nigeria E-Voting System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="bg-green-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Voter Portal
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access your secure voting account or register as a new voter to participate in elections.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Shield className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Login</h3>
                    <p className="text-blue-100">Existing voters</p>
                  </div>
                </div>
                <p className="text-blue-100 mb-6">
                  Sign in with your NIN and biometric verification to access your voting account.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                    <span className="text-sm">NIN authentication</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                    <span className="text-sm">Biometric verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                    <span className="text-sm">Secure voting access</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <button
                  onClick={() => onNavigate('voter-login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Login to Vote
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Secure NIN and biometric authentication
                </p>
              </div>
            </div>

            {/* Register Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Register</h3>
                    <p className="text-green-100">New voters</p>
                  </div>
                </div>
                <p className="text-green-100 mb-6">
                  Create your voter account with NIN verification and biometric enrollment.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                    <span className="text-sm">NIN verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                    <span className="text-sm">Personal information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                    <span className="text-sm">Biometric enrollment</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <button
                  onClick={() => onNavigate('voter-register')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Register to Vote
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  First-time voter registration
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Security & Privacy</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Your personal data is protected with military-grade encryption. All biometric data 
                  is stored as encrypted embeddings and never as raw images. The system complies with 
                  NDPR regulations and INEC security standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            © 2024 Independent National Electoral Commission (INEC) • Secure • Transparent • Democratic
          </p>
        </div>
      </footer>
    </div>
  );
};