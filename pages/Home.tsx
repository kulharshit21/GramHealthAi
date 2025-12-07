
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, Mic, ChevronRight, History, Clock, Stethoscope, ChevronDown, Trash2 } from 'lucide-react';
import { useApp } from '../App';
import { speakText, triggerHaptic } from '../services/utils';
import { DEMO_CONSULTATIONS } from '../constants';
import { ConsultationRecord, LANGUAGES } from '../types';

const Home: React.FC = () => {
  const { t, darkMode, language } = useApp();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ConsultationRecord[]>([]);
  
  // Pagination State
  const [displayCount, setDisplayCount] = useState(5);

  // Centralized Data Loading Logic
  const loadData = useCallback(() => {
    // 1. Get Deleted IDs (Source of Truth for deletions)
    let deletedIds: string[] = [];
    try {
        const stored = localStorage.getItem('gramhealth_deleted_ids');
        deletedIds = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error parsing deleted IDs", e);
        deletedIds = [];
    }

    // 2. Get User History (Created by user)
    let userHistory: ConsultationRecord[] = [];
    try {
        const stored = localStorage.getItem('gramhealth_history');
        userHistory = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error parsing user history", e);
        userHistory = [];
    }

    // 3. Combine with Demos
    // We create a combined list, favoring user history if IDs clash (unlikely)
    const allRecords = [...userHistory, ...DEMO_CONSULTATIONS];

    // 4. Deduplicate by ID
    const uniqueRecordsMap = new Map<string, ConsultationRecord>();
    allRecords.forEach(record => {
        uniqueRecordsMap.set(record.id, record);
    });

    // 5. Filter out deleted items AND Sort by Date (Newest first)
    const finalHistory = Array.from(uniqueRecordsMap.values())
        .filter(record => !deletedIds.includes(record.id))
        .sort((a, b) => b.date - a.date);

    setHistory(finalHistory);
  }, []);

  useEffect(() => {
    // Play Welcome Message once per session
    const hasPlayed = sessionStorage.getItem('welcome_played');
    if (!hasPlayed) {
        speakText(t.welcome, LANGUAGES[language].code);
        sessionStorage.setItem('welcome_played', 'true');
    }

    // Load Data on Mount
    loadData();
  }, [language, t.welcome, loadData]);

  const handleStart = () => {
      triggerHaptic();
      navigate('/consult');
  }

  const loadConsultation = (record: ConsultationRecord) => {
      triggerHaptic();
      sessionStorage.setItem('patientData', JSON.stringify(record.patientData));
      sessionStorage.setItem('analysisResult', JSON.stringify(record.analysisResult));
      // Store full record temporarily for Doctor Share Code logic in Report
      sessionStorage.setItem('currentRecord', JSON.stringify(record));
      navigate('/report');
  }

  const deleteConsultation = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Stop click from opening the report
      triggerHaptic();
      
      if (window.confirm("Are you sure you want to delete this consultation history?")) {
          try {
              // 1. Add ID to the 'Deleted' list (Persists deletion for Demos & History)
              let deletedIds: string[] = [];
              const storedDeleted = localStorage.getItem('gramhealth_deleted_ids');
              if (storedDeleted) {
                  deletedIds = JSON.parse(storedDeleted);
              }
              
              if (!deletedIds.includes(id)) {
                  deletedIds.push(id);
                  localStorage.setItem('gramhealth_deleted_ids', JSON.stringify(deletedIds));
              }

              // 2. Also remove from 'User History' storage to clean up space
              let userHistory: ConsultationRecord[] = [];
              const storedHistory = localStorage.getItem('gramhealth_history');
              if (storedHistory) {
                  userHistory = JSON.parse(storedHistory);
                  const newUserHistory = userHistory.filter(h => h.id !== id);
                  localStorage.setItem('gramhealth_history', JSON.stringify(newUserHistory));
              }

              // 3. Reload Data to update UI immediately
              loadData();

          } catch (e) {
              console.error("Delete failed", e);
              alert("Failed to delete. Please try again.");
          }
      }
  }

  const showMoreHistory = () => {
      setDisplayCount(prev => prev + 5);
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center gap-6 animate-in fade-in">
      
      <div className="text-center space-y-4 mt-4">
        <h2 className={`text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {t.start}
        </h2>
        <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.subtitle}
        </p>
      </div>

      <button
        onClick={handleStart}
        className="w-full max-w-md bg-safe-green hover:bg-green-700 text-white rounded-3xl p-8 shadow-xl transform transition hover:scale-105 active:scale-95 flex flex-col items-center gap-4 group touch-target"
      >
        <div className="bg-white/20 p-4 rounded-full">
          <ChevronRight size={48} className="text-white" />
        </div>
        <span className="text-3xl font-bold">{t.start}</span>
      </button>

      {/* Feature Icons */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center">
        <div className={`flex flex-col items-center gap-2 p-4 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-100 text-gray-900'}`}>
          <Camera size={32} className="text-medical-blue" />
          <span className="text-sm font-medium">{t.upload}</span>
        </div>
        <div className={`flex flex-col items-center gap-2 p-4 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-100 text-gray-900'}`}>
          <Video size={32} className="text-medical-blue" />
          <span className="text-sm font-medium">Video</span>
        </div>
        <div className={`flex flex-col items-center gap-2 p-4 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-100 text-gray-900'}`}>
          <Mic size={32} className="text-medical-blue" />
          <span className="text-sm font-medium">{t.record}</span>
        </div>
      </div>

      {/* Collaboration Links (Doctor Only) */}
      <div className="w-full max-w-md">
           <button onClick={() => navigate('/doctor')} className={`w-full flex items-center justify-center p-4 rounded-xl border text-center gap-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
               <Stethoscope size={24} className="text-medical-blue"/>
               <span className="font-bold">{t.doctor_portal}</span>
           </button>
      </div>
      
      {/* Consultation History / Demos */}
      <div className="w-full max-w-md mt-2">
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <History /> Past Consultations
          </h3>
          <div className="space-y-3">
              {history.length === 0 ? (
                  <div className={`text-center p-4 rounded-xl border border-dashed ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                      No history yet. Start a consultation!
                  </div>
              ) : (
                  history.slice(0, displayCount).map((record) => (
                      <div 
                        key={record.id} 
                        className={`w-full p-2 pr-4 rounded-xl border shadow-sm flex justify-between items-center transition group ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      >
                          <div 
                            onClick={() => loadConsultation(record)}
                            className="flex-1 text-left p-2 cursor-pointer"
                          >
                              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {record.analysisResult.diagnoses[0].localName}
                              </h4>
                              <p className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Clock size={12} /> {new Date(record.date).toLocaleDateString()}
                              </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={(e) => deleteConsultation(e, record.id)}
                                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors active:scale-95"
                                aria-label="Delete record"
                             >
                                 <Trash2 size={20} />
                             </button>
                             <div onClick={() => loadConsultation(record)} className="cursor-pointer">
                                <ChevronRight className="text-gray-400" />
                             </div>
                          </div>
                      </div>
                  ))
              )}
              
              {history.length > displayCount && (
                  <button onClick={showMoreHistory} className="w-full py-3 text-center text-medical-blue font-bold flex items-center justify-center gap-2">
                      Load More <ChevronDown size={16}/>
                  </button>
              )}
          </div>
      </div>

      {!navigator.onLine && (
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
           📡 {t.offline_mode}
        </div>
      )}
    </div>
  );
};

export default Home;
