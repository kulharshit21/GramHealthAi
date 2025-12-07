
import React from 'react';
import { ArrowLeft, MapPin, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { MOCK_COMMUNITY_STATS } from '../constants';

const Community: React.FC = () => {
  const { darkMode, t } = useApp();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen p-4 pb-24 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center gap-4 mb-6">
             <button onClick={() => navigate('/')} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                 <ArrowLeft size={24}/>
             </button>
             <h1 className="text-2xl font-bold">Community Health</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
             {/* Region Header */}
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
                 <div className="flex items-center gap-2 mb-2 opacity-90">
                     <MapPin size={20} />
                     <span className="font-bold uppercase tracking-wider text-sm">Your Region</span>
                 </div>
                 <h2 className="text-3xl font-bold">{MOCK_COMMUNITY_STATS.region}</h2>
                 <p className="mt-2 opacity-90">Based on anonymous data from 1,240 consultations this week.</p>
             </div>

             {/* Active Alerts */}
             <section>
                 <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                     <AlertTriangle className="text-urgent-red" size={20}/> Health Alerts
                 </h3>
                 <div className="space-y-3">
                     {MOCK_COMMUNITY_STATS.activeAlerts.map((alert, i) => (
                         <div key={i} className={`p-4 rounded-2xl flex items-center justify-between ${alert.severity === 'high' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                             <span className="font-bold">{alert.title}</span>
                             <span className="text-xs font-bold uppercase px-2 py-1 bg-white/50 rounded">{alert.severity} Risk</span>
                         </div>
                     ))}
                 </div>
             </section>

             {/* Trends */}
             <section>
                 <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                     <TrendingUp className="text-medical-blue" size={20}/> Common Symptoms Now
                 </h3>
                 <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                     <div className="space-y-4">
                         {MOCK_COMMUNITY_STATS.commonSymptoms.map((sym, i) => (
                             <div key={i}>
                                 <div className="flex justify-between text-sm font-bold mb-1">
                                     <span>{sym.name}</span>
                                     <span>{sym.percentage}%</span>
                                 </div>
                                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                     <div className="bg-medical-blue h-full rounded-full" style={{width: `${sym.percentage}%`}}></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </section>

             {/* Seasonal Tips */}
             <section>
                 <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                     <Shield className="text-safe-green" size={20}/> Seasonal Advice
                 </h3>
                 <div className="grid gap-3">
                     {MOCK_COMMUNITY_STATS.seasonalTips.map((tip, i) => (
                         <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-100 text-green-900'}`}>
                             <p className="font-medium">💡 {tip}</p>
                         </div>
                     ))}
                 </div>
             </section>
        </div>
    </div>
  );
};

export default Community;
