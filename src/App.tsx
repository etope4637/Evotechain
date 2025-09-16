import React, { useState, useEffect, createContext } from 'react';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import { SecureStorageService } from './services/secureStorageService';
import { BlockchainService } from './services/blockchainService';
import { BiometricSecurityService } from './services/biometricSecurityService';
import { NINValidationService } from './services/ninValidationService';
import { AuditSecurityService } from './services/auditSecurityService';
import { ConfigService } from './services/configService';
import { LandingPage } from './components/LandingPage';

// Components
import { LoginForm } from './components/admin/LoginForm';
import { Layout } from './components/admin/Layout';
import { Dashboard } from './components/admin/Dashboard';
import { ElectionManagement } from './components/admin/ElectionManagement';
import { VoterManagement } from './components/admin/VoterManagement';
import { ResultsAnalytics } from './components/admin/ResultsAnalytics';
import { AuditDashboard } from './components/admin/AuditDashboard';
import { SystemSettings } from './components/admin/SystemSettings';
import { SecureVoterInterface } from './components/voter/SecureVoterInterface';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isInitialized, setIsInitialized] = useState(false);
  const authProvider = useAuthProvider();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize storage
      await SecureStorageService.initialize();
      
      // Initialize system configuration
      await ConfigService.initialize();
      
      // Initialize audit service
      await AuditSecurityService.initialize();
      
      // Initialize NIN service
      await NINValidationService.initialize();
      
      // Initialize blockchain
      await BlockchainService.initializeBlockchain();
      
      // Initialize biometric service
      await BiometricSecurityService.initializeModel();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsInitialized(true); // Continue even if initialization fails
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing Nigeria E-Voting System
          </h2>
          <p className="text-gray-600">
            Setting up secure blockchain, biometric services, and audit systems...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authProvider}>
      <div className="App">
        {currentView === 'landing' ? (
          <LandingPage onNavigate={handleNavigate} />
        ) : !authProvider.user && currentView !== 'voter' ? (
          <LoginForm />
        ) : currentView === 'voter' ? (
          <SecureVoterInterface onNavigate={handleNavigate} />
        ) : (
          <Layout currentView={currentView} onNavigate={handleNavigate}>
            {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
            {currentView === 'elections' && <ElectionManagement onNavigate={handleNavigate} />}
            {currentView === 'results' && <ResultsAnalytics onNavigate={handleNavigate} />}
            {currentView === 'voters' && <VoterManagement onNavigate={handleNavigate} />}
            {currentView === 'audit' && <AuditDashboard onNavigate={handleNavigate} />}
            {currentView === 'settings' && <SystemSettings onNavigate={handleNavigate} />}
          </Layout>
        )}
      </div>
    </AuthContext.Provider>
  );
}

export default App;