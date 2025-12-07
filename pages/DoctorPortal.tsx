
import React, { useState } from 'react';
import { ArrowLeft, Search, FileText, PlusCircle, Check, Scan, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { DEMO_CONSULTATIONS, MOCK_DOCTORS } from '../constants';
import { ConsultationRecord, DoctorNote } from '../types';
import { digitizePrescription } from '../services/geminiService';

const DoctorPortal: React.FC = () => {
  const { darkMode } = useApp();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [activeRecord, setActiveRecord] = useState<ConsultationRecord | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDigitizing, setIsDigitizing] = useState(false);

  // Mock Login - in reality this would check a backend
  const handleSearch = () => {
    const found = DEMO_CONSULTATIONS.find(r => r.shareCode === accessCode);
    if (found) {
        setActiveRecord(found);
    } else {
        alert("Patient record not found. Try code: GH-2025-FUN");
    }
  };

  const handleAddNote = () => {
      if (!activeRecord || !noteText) return;
      const newNote: DoctorNote = {
          id: Date.now().toString(),
          doctorId: MOCK_DOCTORS[0].id,
          doctorName: MOCK_DOCTORS[0].name,
          text: noteText,
          timestamp: Date.now()
      };
      // In a real app, update DB. Here update state mock.
      const updated = { ...activeRecord, doctorNotes: [...(activeRecord.doctorNotes || []), newNote] };
      setActiveRecord(updated);
      setNoteText('');
      alert("Note added successfully!");
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsDigitizing(true);
          const text = await digitizePrescription(e.target.files[0]);
          setNoteText(prev => prev + "\n[Rx]: " + text);
          setIsDigitizing(false);
      }
  };

  return (
    <div className={`min-h-screen p-4 pb-24 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
             <button onClick={() => navigate('/')} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                 <ArrowLeft size={24}/>
             </button>
             <h1 className="text-2xl font-bold">Doctor Portal</h1>
        </div>

        {!activeRecord ? (
            <div className={`max-w-md mx-auto p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-bold mb-4">Access Patient Records</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Enter Share Code</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="e.g. GH-2025-ABC"
                                className={`flex-1 p-3 rounded-xl border outline-none focus:ring-2 ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                            />
                            <button onClick={handleSearch} className="bg-medical-blue text-white p-3 rounded-xl font-bold">
                                <Search size={24} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Try demo code: GH-2025-FUN</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom">
                 {/* Patient Summary Card */}
                 <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-100'}`}>
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <h2 className="text-2xl font-bold text-medical-blue">Patient Case #{activeRecord.shareCode}</h2>
                             <p className="text-sm opacity-70">Date: {new Date(activeRecord.date).toLocaleDateString()}</p>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-xs font-bold ${activeRecord.analysisResult.diagnoses[0].urgency === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                             {activeRecord.analysisResult.diagnoses[0].urgency}
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                             <span className="text-xs font-bold uppercase opacity-60">Complaint</span>
                             <p className="font-medium">{activeRecord.patientData.symptoms}</p>
                         </div>
                         <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                             <span className="text-xs font-bold uppercase opacity-60">AI Diagnosis</span>
                             <p className="font-medium">{activeRecord.analysisResult.diagnoses[0].name}</p>
                         </div>
                     </div>

                     <div className="mb-6">
                        <span className="text-xs font-bold uppercase opacity-60 mb-2 block">Visual Findings</span>
                        {activeRecord.analysisResult.boundingBoxes.map((box, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded mr-2 text-sm">
                                {box.label} ({box.severity})
                            </span>
                        ))}
                     </div>

                     {/* Doctor Actions */}
                     <div className="border-t pt-4 space-y-4 dark:border-gray-700">
                         <h3 className="font-bold flex items-center gap-2">
                             <PenTool size={18}/> Doctor Notes
                         </h3>
                         
                         {activeRecord.doctorNotes?.map((note, i) => (
                             <div key={i} className={`p-3 rounded-xl text-sm ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                                 <div className="font-bold text-medical-blue flex justify-between">
                                     {note.doctorName}
                                     <span className="text-xs font-normal opacity-70">{new Date(note.timestamp).toLocaleDateString()}</span>
                                 </div>
                                 <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
                             </div>
                         ))}

                         <div className="space-y-2">
                             <textarea 
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add clinical notes or prescription..."
                                className={`w-full p-3 rounded-xl border outline-none h-32 resize-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                             />
                             <div className="flex gap-2">
                                 <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold cursor-pointer hover:bg-purple-700">
                                     <Scan size={18}/> {isDigitizing ? 'Scanning...' : 'Scan Rx'}
                                     <input type="file" accept="image/*" className="hidden" onChange={handlePrescriptionUpload} />
                                 </label>
                                 <button onClick={handleAddNote} className="flex-1 flex items-center justify-center gap-2 bg-medical-blue text-white py-2 rounded-xl font-bold hover:bg-blue-700">
                                     <PlusCircle size={18}/> Add Note
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default DoctorPortal;
