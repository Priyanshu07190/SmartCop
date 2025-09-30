import React, { useState } from 'react';
import { useEffect } from 'react';
import { Shield, Mic, FileText, Camera, MessageSquare, Map, Settings, Menu, X } from 'lucide-react';
import { supabase } from './services/supabaseService';
import Dashboard from './components/Dashboard';
import TranscriptionView from './components/TranscriptionView';
import FIRDrafting from './components/FIRDrafting';
import EvidenceManager from './components/EvidenceManager';
import Timeline from './components/Timeline';
import LegalChatbot from './components/LegalChatbot';
import PredictivePolicing from './components/PredictivePolicing';
import SettingsPanel from './components/SettingsPanel';
import AuthPage from './components/AuthPage';
import { SupabaseService } from './services/supabaseService';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    // Check if user is already logged in with Supabase
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get additional user data from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData && !error) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await supabaseService.logout();
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'transcription', label: 'Transcription', icon: Mic },
    { id: 'fir', label: 'FIR Drafting', icon: FileText },
    { id: 'evidence', label: 'Evidence', icon: Camera },
    { id: 'timeline', label: 'Timeline', icon: FileText },
    { id: 'chatbot', label: 'Legal AI', icon: MessageSquare },
    { id: 'policing', label: 'Predictive', icon: Map },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} user={user} />;
      case 'transcription':
        return <TranscriptionView />;
      case 'fir':
        return <FIRDrafting />;
      case 'evidence':
        return <EvidenceManager />;
      case 'timeline':
        return <Timeline />;
      case 'chatbot':
        return <LegalChatbot />;
      case 'policing':
        return <PredictivePolicing />;
      case 'settings':
        return <SettingsPanel user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-navy-800">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-gold-400" />
            <span className="text-xl font-bold text-white">SmartCop</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gold-400"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-navy-700 transition-colors ${
                  currentView === item.id ? 'bg-navy-700 border-r-4 border-gold-400' : ''
                }`}
              >
                <Icon className="h-5 w-5 text-gray-300 mr-3" />
                <span className="text-gray-300">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {currentView === 'fir' ? 'FIR Drafting' : currentView}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-navy-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user?.rank} {user?.full_name || 'User'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default App;