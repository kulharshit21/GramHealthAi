
import React, { createContext, useContext, useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sun, Moon, Type, Eye, ShieldCheck, ChevronRight, X, Loader2 } from 'lucide-react';
import { Language, LANGUAGES, PermissionState } from './types';
import { TRANSLATIONS } from './constants';
import { triggerHaptic } from './services/utils';
import { PermissionScreen } from './components/PermissionScreen';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Consultation = lazy(() => import('./pages/Consultation'));
const Report = lazy(() => import('./pages/Report'));
const DoctorPortal = lazy(() => import('./pages/DoctorPortal'));

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  permissions: PermissionState;
}

const AppContext = createContext<AppContextType>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
  darkMode: false,
  toggleDarkMode: () => {},
  fontSize: 100,
  setFontSize: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
  permissions: { camera: false, microphone: false, completed: false }
});

export const useApp = () => useContext(AppContext);

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-medical-blue">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="animate-pulse font-medium">Loading module...</p>
    </div>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(100);
  
  // App Flow State
  const [showSplash, setShowSplash] = useState(true);
  const [permissions, setPermissions] = useState<PermissionState>({ camera: false, microphone: false, completed: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize
  useEffect(() => {
    const savedMode = localStorage.getItem('gramhealth_dark_mode');
    if (savedMode === 'true') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }

    const savedPerms = localStorage.getItem('gramhealth_permissions');
    if (savedPerms) {
        setPermissions(JSON.parse(savedPerms));
    }

    const firstTime = !localStorage.getItem('gramhealth_visited');
    
    // Splash Timer
    setTimeout(() => {
        setShowSplash(false);
        // Only show onboarding if permissions are done AND it's first time
        // Logic: Splash -> Permissions (if !completed) -> Onboarding (if firstTime) -> Home
        if (firstTime && savedPerms && JSON.parse(savedPerms).completed) {
             setShowOnboarding(true);
        }
    }, 2500);

  }, []);

  // Update Font Scale Class
  useEffect(() => {
      document.documentElement.className = `font-scale-${fontSize} ${darkMode ? 'dark' : ''} ${highContrast ? 'high-contrast' : ''}`;
  }, [fontSize, darkMode, highContrast]);

  const toggleDarkMode = () => {
      triggerHaptic();
      setDarkMode(prev => {
          const newState = !prev;
          localStorage.setItem('gramhealth_dark_mode', String(newState));
          return newState;
      });
  };

  const toggleHighContrast = () => {
      triggerHaptic();
      setHighContrast(prev => !prev);
  }

  const completePermissions = (perms: PermissionState) => {
      setPermissions(perms);
      localStorage.setItem('gramhealth_permissions', JSON.stringify(perms));
      
      const firstTime = !localStorage.getItem('gramhealth_visited');
      if (firstTime) setShowOnboarding(true);
  };

  const completeOnboarding = () => {
      triggerHaptic();
      setShowOnboarding(false);
      setShowDisclaimer(true);
      localStorage.setItem('gramhealth_visited', 'true');
  }

  const acceptDisclaimer = () => {
      triggerHaptic();
      setShowDisclaimer(false);
  }

  const t = TRANSLATIONS[language];

  // --- RENDERING ---

  // 1. Splash Screen
  if (showSplash) {
      return (
          <div className="fixed inset-0 bg-medical-blue flex flex-col items-center justify-center text-white z-50">
              <div className="text-6xl mb-4 animate-bounce">✚</div>
              <h1 className="text-4xl font-bold mb-2">GramHealth AI</h1>
              <p className="text-lg opacity-90">Connecting Rural India to Healthcare</p>
              <div className="mt-8 w-48 h-1 bg-blue-400 rounded-full overflow-hidden">
                  <div className="h-full bg-white animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
              </div>
          </div>
      );
  }

  // 2. Permission Screen (If not completed)
  if (!permissions.completed) {
      return (
        <AppContext.Provider value={{ language, setLanguage, t, darkMode, toggleDarkMode, fontSize, setFontSize, highContrast, toggleHighContrast, permissions }}>
            <PermissionScreen onComplete={completePermissions} />
        </AppContext.Provider>
      );
  }

  // 3. Onboarding
  if (showOnboarding) {
      return (
          <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 items-center justify-center text-center">
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  <img src="https://img.icons8.com/color/96/doctor-male.png" alt="Doctor" className="w-32 h-32"/>
                  <h2 className="text-3xl font-bold text-medical-blue">Welcome to GramHealth</h2>
                  <p className="text-xl text-gray-600">Your personal AI health assistant.</p>
                  
                  <div className="space-y-4 text-left max-w-xs mx-auto text-lg text-gray-700">
                      <div className="flex items-center gap-3">
                          <span className="bg-blue-100 p-2 rounded-full text-medical-blue">📸</span> Upload photos
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="bg-blue-100 p-2 rounded-full text-medical-blue">🗣️</span> Speak symptoms
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="bg-blue-100 p-2 rounded-full text-medical-blue">🩺</span> Get instant advice
                      </div>
                  </div>
              </div>
              <button onClick={completeOnboarding} className="w-full bg-medical-blue text-white py-4 rounded-xl text-xl font-bold shadow-lg touch-target">
                  Get Started
              </button>
          </div>
      );
  }

  // 4. Disclaimer Modal
  if (showDisclaimer) {
      return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <ShieldCheck size={48} className="text-urgent-red mx-auto mb-4"/>
                  <h2 className="text-2xl font-bold text-center mb-4">{t.disclaimer_title}</h2>
                  <p className="text-lg text-gray-700 mb-6 text-center leading-relaxed">
                      {t.disclaimer_text}
                  </p>
                  <button onClick={acceptDisclaimer} className="w-full bg-medical-blue text-white py-4 rounded-xl text-xl font-bold shadow-lg touch-target">
                      {t.accept}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <AppContext.Provider value={{ language, setLanguage, t, darkMode, toggleDarkMode, fontSize, setFontSize, highContrast, toggleHighContrast, permissions }}>
      <HashRouter>
        <div className={`min-h-screen pb-4 transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <header className={`p-4 shadow-md sticky top-0 z-40 transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-medical-blue'}`}>
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl ${darkMode ? 'bg-medical-blue text-white' : 'bg-white text-medical-blue'}`}>
                  ✚
                </div>
                <h1 className="text-white text-2xl font-bold hidden sm:block">GramHealth AI</h1>
              </div>
              
              <div className="flex items-center gap-2">
                  <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white/20 rounded-full text-white touch-target">
                      <Type size={24} />
                  </button>

                  <select
                    value={language}
                    onChange={(e) => { triggerHaptic(); setLanguage(e.target.value as Language); }}
                    className={`px-2 py-2 rounded-lg font-bold text-lg touch-target max-w-[120px] ${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-medical-blue'}`}
                  >
                    {Object.entries(LANGUAGES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.flag} {val.label}
                      </option>
                    ))}
                  </select>
              </div>
            </div>

            {/* Accessibility Settings Dropdown */}
            {showSettings && (
                <div className={`absolute top-full right-0 mt-2 w-64 p-4 rounded-xl shadow-xl border z-50 mx-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold">Accessibility</h3>
                        <button onClick={() => setShowSettings(false)}><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Text Size</label>
                            <div className="flex gap-2">
                                <button onClick={() => setFontSize(100)} className={`flex-1 py-2 rounded border ${fontSize === 100 ? 'bg-blue-100 border-blue-500 text-blue-800' : ''}`}>A</button>
                                <button onClick={() => setFontSize(150)} className={`flex-1 py-2 rounded border text-lg font-bold ${fontSize === 150 ? 'bg-blue-100 border-blue-500 text-blue-800' : ''}`}>A+</button>
                                <button onClick={() => setFontSize(200)} className={`flex-1 py-2 rounded border text-xl font-bold ${fontSize === 200 ? 'bg-blue-100 border-blue-500 text-blue-800' : ''}`}>A++</button>
                            </div>
                        </div>

                        <button onClick={toggleDarkMode} className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <span>Dark Mode</span>
                            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>

                        <button onClick={toggleHighContrast} className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <span>High Contrast</span>
                            <Eye size={20} className={highContrast ? 'text-blue-600' : ''} />
                        </button>
                    </div>
                </div>
            )}
          </header>

          <main className="max-w-4xl mx-auto">
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/consult" element={<Consultation />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/doctor" element={<DoctorPortal />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Suspense>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
