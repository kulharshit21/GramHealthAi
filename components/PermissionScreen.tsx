

import React, { useState } from 'react';
import { Mic, Camera, Check, ChevronRight, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../App';
import { requestMediaPermissions, triggerHaptic } from '../services/utils';
import { PermissionState } from '../types';

interface PermissionScreenProps {
    onComplete: (perms: PermissionState) => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({ onComplete }) => {
    const { t, darkMode } = useApp();
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [toggles, setToggles] = useState({ camera: true, microphone: true });
    const [isLoading, setIsLoading] = useState(false);

    const handleAllowAll = async () => {
        setIsLoading(true);
        triggerHaptic();

        // Request Media (Mic + Cam) - triggers native browser popup
        let mediaGranted = false;
        try {
            mediaGranted = await requestMediaPermissions();
        } catch (e) { console.warn("Media denied"); }
        
        // Complete
        const finalState: PermissionState = {
            camera: mediaGranted,
            microphone: mediaGranted,
            completed: true
        };
        
        onComplete(finalState);
    };

    const handleCustomContinue = async () => {
        setIsLoading(true);
        triggerHaptic();
        
        let mediaGranted = false;
        if (toggles.camera || toggles.microphone) {
             mediaGranted = await requestMediaPermissions();
        }

        const finalState: PermissionState = {
            camera: toggles.camera && mediaGranted,
            microphone: toggles.microphone && mediaGranted,
            completed: true
        };

        onComplete(finalState);
    };

    const toggle = (key: 'camera' | 'microphone') => {
        triggerHaptic();
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    }

    // Render Custom Mode
    if (isCustomMode) {
        return (
            <div className={`fixed inset-0 z-50 flex flex-col p-6 animate-in fade-in duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center space-y-6">
                    <h2 className="text-2xl font-bold text-center">{t.perm_custom}</h2>
                    
                    {/* Microphone Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Mic size={32} className="text-purple-500"/>
                            <div>
                                <h3 className="font-bold">{t.perm_mic}</h3>
                                <p className="text-xs opacity-70">{t.perm_mic_desc}</p>
                            </div>
                        </div>
                        <button onClick={() => toggle('microphone')}>
                            {toggles.microphone ? <ToggleRight size={32} className="text-green-500"/> : <ToggleLeft size={32} className="text-gray-400"/>}
                        </button>
                    </div>

                    {/* Camera Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-2xl">
                         <div className="flex items-center gap-3">
                            <Camera size={32} className="text-blue-500"/>
                            <div>
                                <h3 className="font-bold">{t.perm_cam}</h3>
                                <p className="text-xs opacity-70">{t.perm_cam_desc}</p>
                            </div>
                        </div>
                        <button onClick={() => toggle('camera')}>
                            {toggles.camera ? <ToggleRight size={32} className="text-green-500"/> : <ToggleLeft size={32} className="text-gray-400"/>}
                        </button>
                    </div>
                </div>

                 <button 
                    onClick={handleCustomContinue}
                    disabled={isLoading}
                    className="w-full max-w-md mx-auto bg-medical-blue text-white py-4 rounded-xl text-xl font-bold shadow-lg touch-target flex items-center justify-center gap-2"
                >
                    {isLoading ? "Saving..." : t.perm_continue} <ChevronRight size={20} />
                </button>
            </div>
        )
    }

    // Default "Allow All" Mode
    return (
        <div className={`fixed inset-0 z-50 flex flex-col p-6 animate-in fade-in duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 max-w-md mx-auto w-full">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-medical-blue rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">{t.perm_title}</h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.perm_desc}</p>
                </div>

                {/* Items */}
                <div className="space-y-6 w-full">
                    {/* Microphone */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full shrink-0 dark:bg-purple-900/30 dark:text-purple-300">
                            <Mic size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{t.perm_mic}</h3>
                            <p className="opacity-80 leading-snug">{t.perm_mic_desc}</p>
                        </div>
                    </div>

                    {/* Camera */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0 dark:bg-blue-900/30 dark:text-blue-300">
                            <Camera size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{t.perm_cam}</h3>
                            <p className="opacity-80 leading-snug">{t.perm_cam_desc}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 space-y-4 max-w-md mx-auto w-full text-center">
                <button 
                    onClick={handleAllowAll}
                    disabled={isLoading}
                    className="w-full bg-medical-blue text-white py-4 rounded-xl text-xl font-bold shadow-lg touch-target flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95"
                >
                    {isLoading ? "Requesting..." : t.perm_allow_all} <Check size={24} />
                </button>
                <button 
                    onClick={() => { setIsCustomMode(true); triggerHaptic(); }}
                    className="py-2 text-sm font-bold opacity-60 hover:opacity-100 underline decoration-dotted"
                >
                    {t.perm_custom}
                </button>
            </div>
        </div>
    );
};