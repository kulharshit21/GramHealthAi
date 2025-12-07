
import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Users, Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Caregiver } from '../types';

const FamilyAccess: React.FC = () => {
  const { darkMode } = useApp();
  const navigate = useNavigate();
  
  // Mock State
  const [caregivers, setCaregivers] = useState<Caregiver[]>([
      { id: '1', name: "Rahul (Son)", relation: "Son", accessLevel: "full_access", phone: "+91 98765 43210" }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
      if(!newName) return;
      const newCg: Caregiver = {
          id: Date.now().toString(),
          name: newName,
          relation: "Family",
          accessLevel: "view_only",
          phone: ""
      };
      setCaregivers([...caregivers, newCg]);
      setNewName('');
      setShowAddModal(false);
  };

  const removeCaregiver = (id: string) => {
      setCaregivers(caregivers.filter(c => c.id !== id));
  };

  return (
    <div className={`min-h-screen p-4 pb-24 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center gap-4 mb-6">
             <button onClick={() => navigate('/')} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
                 <ArrowLeft size={24}/>
             </button>
             <h1 className="text-2xl font-bold">Family Access</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
             <div className="bg-medical-blue rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                 <Users className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
                 <h2 className="text-xl font-bold relative z-10">Caregiver Management</h2>
                 <p className="opacity-90 relative z-10 max-w-xs">Allow trusted family members to view your health reports and receive medication reminders.</p>
             </div>

             <div className="flex justify-between items-center">
                 <h3 className="font-bold text-lg">Your Caregivers</h3>
                 <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 text-sm font-bold text-medical-blue bg-blue-50 px-3 py-1.5 rounded-full">
                     <UserPlus size={16}/> Add New
                 </button>
             </div>

             <div className="space-y-3">
                 {caregivers.map(cg => (
                     <div key={cg.id} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                 {cg.name[0]}
                             </div>
                             <div>
                                 <h4 className="font-bold">{cg.name}</h4>
                                 <p className="text-xs opacity-60 flex items-center gap-1">
                                     <Lock size={10}/> {cg.accessLevel === 'full_access' ? 'Full Access' : 'View Only'}
                                 </p>
                             </div>
                         </div>
                         <button onClick={() => removeCaregiver(cg.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                             <Trash2 size={18}/>
                         </button>
                     </div>
                 ))}
                 
                 {caregivers.length === 0 && (
                     <div className="text-center p-8 text-gray-400">No caregivers added yet.</div>
                 )}
             </div>
        </div>

        {/* Simple Modal */}
        {showAddModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className={`w-full max-w-sm p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Name (e.g. Rahul)"
                        className={`w-full p-3 rounded-xl border mb-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold border">Cancel</button>
                        <button onClick={handleAdd} className="flex-1 py-3 rounded-xl font-bold bg-medical-blue text-white">Add</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FamilyAccess;
