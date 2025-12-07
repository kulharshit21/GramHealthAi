

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Image as ImageIcon, Video as VideoIcon, Loader2, Send, 
  AlertTriangle, CheckCircle, Info, ZoomIn, ZoomOut, Maximize2, 
  RotateCcw, Cloud, Check, PartyPopper, ArrowRight, Play, Pause, 
  FastForward, Rewind, Stethoscope, ShieldAlert, Activity, FileText,
  ChevronLeft, ChevronRight as ChevronRightIcon, X, MessageSquare,
  User, Bot, Clock, HelpCircle, Eye, Smile, Droplet, Trees, Camera,
  ArrowLeft, Download, MapPin, ExternalLink
} from 'lucide-react';
import { useApp } from '../App';
import { DURATION_OPTIONS, SYMPTOM_TAGS, GUIDED_VIDEO_PROMPTS } from '../constants';
import { analyzeMedicalData, chatWithAI, generateMedicalDiagram } from '../services/geminiService';
import { AnalysisResult, Message, PatientData, LANGUAGES, ConsultationRecord, BoundingBox } from '../types';
import { compressImage, triggerHaptic, speakText } from '../services/utils';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

const Consultation: React.FC = () => {
  const { t, language, darkMode } = useApp();
  const navigate = useNavigate();
  
  // Steps: input -> analyzing -> success -> results
  const [step, setStep] = useState<'input' | 'analyzing' | 'success' | 'results'>('input');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]);
  const [painLevel, setPainLevel] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Advanced Visuals State
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0); 
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  // Live Video Recording State
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null); // Use number for browser context

  // Live Photo State
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const photoVideoRef = useRef<HTMLVideoElement>(null);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Load progress on mount
  useEffect(() => {
    // 1. Restore Form Data
    const saved = localStorage.getItem('gramhealth_progress');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.textInput) setTextInput(parsed.textInput);
            if (parsed.duration) setDuration(parsed.duration);
            if (parsed.painLevel) setPainLevel(parsed.painLevel);
            if (parsed.selectedSymptoms) setSelectedSymptoms(parsed.selectedSymptoms);
        } catch(e) { console.error("Failed to restore progress", e); }
    }

    // 2. Restore Chat Messages (Persist chat across navigation)
    const savedChat = sessionStorage.getItem('current_chat_messages');
    if (savedChat) {
        try {
            setMessages(JSON.parse(savedChat));
        } catch (e) { console.error("Failed to restore chat", e); }
    }

    // 3. Restore Visual Evidence (Important for tab switching)
    const savedPreviews = sessionStorage.getItem('current_media_previews');
    if (savedPreviews) {
        try {
            setPreviews(JSON.parse(savedPreviews));
        } catch (e) { console.error("Failed to restore previews", e); }
    }

    // 4. Restore Result State if returning to results
    const savedResult = sessionStorage.getItem('analysisResult');
    if (savedResult) {
        const parsedResult = JSON.parse(savedResult);
        setAnalysisResult(parsedResult);
        // Only set step to results if we actually have a result
        if (sessionStorage.getItem('patientData')) {
             setStep('results');
        }
    }
  }, []);

  // Auto-save Form
  useEffect(() => {
    if (step !== 'input') return;
    setSaveStatus('saving');
    const saveData = () => {
        const data = { textInput, duration, painLevel, selectedSymptoms, timestamp: Date.now() };
        localStorage.setItem('gramhealth_progress', JSON.stringify(data));
        setSaveStatus('saved');
    };
    // Use window.setTimeout to avoid Node types conflict
    const timeout = window.setTimeout(saveData, 1000);
    return () => window.clearTimeout(timeout);
  }, [textInput, duration, painLevel, selectedSymptoms, step]);

  // Persist Chat whenever it changes
  useEffect(() => {
      if (messages.length > 0) {
          sessionStorage.setItem('current_chat_messages', JSON.stringify(messages));
      }
      if (step === 'results') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, step]);

  // Persist Previews whenever they change
  useEffect(() => {
      if (previews.length > 0) {
          try {
              sessionStorage.setItem('current_media_previews', JSON.stringify(previews));
          } catch (e) {
              console.warn("Quota exceeded for previews storage", e);
          }
      }
  }, [previews]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = LANGUAGES[language]?.code || 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            setTextInput(prev => (prev.length > 0 && !prev.endsWith(' ') ? prev + " " + transcript : prev + transcript));
        }
      };

      recognition.onerror = () => { setIsRecording(false); isRecordingRef.current = false; };
      recognition.onend = () => {
        if (isRecordingRef.current) recognition.start();
        else setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.stop();
  }, [language]);

  // Clean up recording timer on unmount
  useEffect(() => {
      return () => {
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          if (activeStreamRef.current) {
               activeStreamRef.current.getTracks().forEach(track => track.stop());
          }
      }
  }, []);

  // Video Preview Attachment
  useEffect(() => {
      if (isRecordingVideo && liveVideoRef.current && activeStreamRef.current) {
          liveVideoRef.current.srcObject = activeStreamRef.current;
          liveVideoRef.current.play().catch(e => console.log("Play error", e));
      }
  }, [isRecordingVideo]);

  // Photo Preview Attachment
  useEffect(() => {
    if (isTakingPhoto && photoVideoRef.current && activeStreamRef.current) {
        photoVideoRef.current.srcObject = activeStreamRef.current;
        photoVideoRef.current.play().catch(e => console.log(e));
    }
  }, [isTakingPhoto]);

  // Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsCompressing(true);
      const rawFiles = Array.from(e.target.files) as File[];
      const processedFiles: File[] = [];

      for (let i = 0; i < rawFiles.length; i++) {
          const file = rawFiles[i];
          if (file.type.startsWith('image')) {
             try {
                 const compressed = await compressImage(file);
                 processedFiles.push(compressed);
             } catch(e) { processedFiles.push(file); }
          } else {
             processedFiles.push(file);
          }
          setUploadProgress(Math.round(((i + 1) / rawFiles.length) * 100));
      }

      setFiles((prev) => [...prev, ...processedFiles]);
      
      const newPreviews: string[] = [];
      for (const file of processedFiles) {
          const reader = new FileReader();
          await new Promise<void>(resolve => {
              reader.onloadend = () => {
                  newPreviews.push(reader.result as string);
                  resolve();
              };
              reader.readAsDataURL(file);
          });
      }
      
      setPreviews(prev => {
          const updated = [...prev, ...newPreviews];
          return updated;
      });
      
      setIsCompressing(false);
      setUploadProgress(0);
      triggerHaptic();
    }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  const toggleRecording = () => {
    triggerHaptic();
    const recognition = recognitionRef.current;
    if (!recognition) return alert("Voice not supported");

    if (isRecording) {
      isRecordingRef.current = false;
      recognition.stop();
      setIsRecording(false);
    } else {
      isRecordingRef.current = true;
      recognition.start();
      setIsRecording(true);
    }
  };

  const startVideoRecording = async () => {
      triggerHaptic();
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' }, 
              audio: true 
          });
          
          activeStreamRef.current = stream; 
          
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                  chunksRef.current.push(e.data);
              }
          };

          mediaRecorder.onstop = () => {
              const blob = new Blob(chunksRef.current, { type: 'video/webm' });
              const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
              
              // Convert to Base64 for persistence
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                  const base64 = reader.result as string;
                  setPreviews(prev => [...prev, base64]); // Store Base64, not Blob URL
                  setFiles(prev => [...prev, file]);
              }
              
              // Stop tracks
              if (activeStreamRef.current) {
                  activeStreamRef.current.getTracks().forEach(track => track.stop());
                  activeStreamRef.current = null;
              }
              setIsRecordingVideo(false);
              setRecordingTime(0);
          };

          setIsRecordingVideo(true);
          setRecordingTime(0);
          
          mediaRecorder.start();

          recordingTimerRef.current = window.setInterval(() => {
              setRecordingTime(prev => {
                  if (prev >= 60) {
                      stopVideoRecording();
                      return 60;
                  }
                  return prev + 1;
              });
          }, 1000);

      } catch (err) {
          console.error("Error accessing camera", err);
          alert("Could not access camera. Please check permissions.");
      }
  };

  const stopVideoRecording = () => {
      triggerHaptic();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
      }
  };

  // --- Live Photo Logic ---

  const startPhotoSession = async () => {
    triggerHaptic();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        activeStreamRef.current = stream;
        setIsTakingPhoto(true);
    } catch (err) {
        console.error("Camera error", err);
        alert("Could not access camera.");
    }
  };

  const capturePhoto = async () => {
    triggerHaptic();
    if (photoVideoRef.current) {
        const video = photoVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                
                // Compress logic
                let finalFile = file;
                try {
                     finalFile = await compressImage(file);
                } catch(e) {}

                // Add to files
                setFiles(prev => [...prev, finalFile]);

                // Preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(finalFile);

                stopPhotoSession();
            }
        }, 'image/jpeg', 0.9);
    }
  };

  const stopPhotoSession = () => {
    if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
    }
    setIsTakingPhoto(false);
  };

  const handleAnalyze = async () => {
    triggerHaptic();
    if (!navigator.onLine) {
        alert(t.offline_mode);
        navigate('/');
        return;
    }

    setStep('analyzing');
    localStorage.removeItem('gramhealth_progress');
    const metadata = `Duration: ${duration}, Pain: ${painLevel}/10, Tags: ${selectedSymptoms.join(', ')}`;
    
    try {
      const result = await analyzeMedicalData(files, textInput, metadata, language);
      setAnalysisResult(result);
      setActiveImageIndex(0);
      
      // Speak the explanation
      speakText(result.overallExplanation, LANGUAGES[language].code);

      if (result.visualDiagramQuery) {
          generateMedicalDiagram(result.visualDiagramQuery).then(img => {
              if (img) setGeneratedDiagram(img);
          });
      }

      const record: ConsultationRecord = {
          id: Date.now().toString(),
          date: Date.now(),
          patientData: { symptoms: textInput, duration, painLevel, otherSymptoms: selectedSymptoms, mediaFiles: files },
          analysisResult: result
      };
      
      const history = JSON.parse(localStorage.getItem('gramhealth_history') || '[]');
      localStorage.setItem('gramhealth_history', JSON.stringify([record, ...history]));

      setStep('success'); 
      setMessages([{ id: '1', sender: 'ai', text: result.overallExplanation }]);
      sessionStorage.setItem('patientData', JSON.stringify(record.patientData));
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
      sessionStorage.setItem('currentRecord', JSON.stringify(record));
      setTimeout(() => setStep('results'), 2500);

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Try again.");
      setStep('input');
    }
  };

  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      const userText = chatInput;
      setChatInput('');
      triggerHaptic();
      
      const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText };
      const updatedMessages = [...messages, newUserMsg];
      setMessages(updatedMessages);
      setIsChatLoading(true);

      const historyPayload = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
      }));
      
      const contextMsg = {
          role: 'user', 
          parts: [{ text: `[System Context: Patient diagnosis is ${analysisResult?.diagnoses[0].name}. Findings: ${analysisResult?.boundingBoxes.map(b => b.label).join(', ')}.]` }]
      };
      const apiHistory = [contextMsg as any, ...historyPayload];

      const responseText = await chatWithAI(apiHistory, userText, language);
      
      const newAiMsg: Message = { id: (Date.now()+1).toString(), sender: 'ai', text: responseText };
      setMessages(prev => [...prev, newAiMsg]);
      setIsChatLoading(false);
      speakText(responseText, LANGUAGES[language].code);
  };

  const isVideo = (index: number) => {
      if (!previews[index]) return false;
      return previews[index].startsWith('data:video') || previews[index].startsWith('blob:');
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  };

  const jumpToTime = (timeStr: string) => {
    const seconds = parseTime(timeStr);
    if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play();
        triggerHaptic();
    }
  };

  const handleLoadedMetadata = (e: any) => {
      setVideoDuration(e.target.duration);
  };

  const handleTimeUpdate = (e: any) => {
      setVideoCurrentTime(e.target.currentTime);
  };

  const renderBoundingBoxes = (boxes: BoundingBox[]) => {
      if (!showOverlay || isVideo(activeImageIndex)) return null;
      
      return boxes.map((box, i) => {
          const top = box.ymin / 10;
          const left = box.xmin / 10;
          const width = (box.xmax - box.xmin) / 10;
          const height = (box.ymax - box.ymin) / 10;
          
          let colorClass = "border-blue-500 bg-blue-500/20";
          if (box.severity === 'high') colorClass = "border-red-500 bg-red-500/20";
          if (box.severity === 'moderate') colorClass = "border-yellow-500 bg-yellow-500/20";
          if (box.severity === 'healing') colorClass = "border-green-500 bg-green-500/20";

          const isSelected = selectedBoxIndex === i;

          return (
              <div 
                key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedBoxIndex(i); triggerHaptic(); }}
                className={`absolute border-2 ${colorClass} transition-all duration-300 cursor-pointer flex items-start justify-start ${isSelected ? 'ring-2 ring-white z-10' : 'z-0'}`}
                style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
              >
                  <span className={`bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-br font-bold ${isSelected ? 'bg-medical-blue' : ''}`}>
                      #{i + 1}
                  </span>
              </div>
          );
      });
  };

  const goBackHome = () => {
      triggerHaptic();
      navigate('/');
  }

  const handleDownloadPDF = async () => {
      const element = document.getElementById('report-content');
      if (element && typeof html2pdf !== 'undefined') {
          // cloning the element to remove buttons/UI artifacts before printing
          const opt = {
              margin: [10, 10, 10, 10], // top, left, bottom, right
              filename: `GramHealth_Report_${Date.now()}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          try {
             await html2pdf().set(opt).from(element).save();
          } catch(e) {
             console.error("PDF generation failed", e);
             alert("PDF generation failed. Opening print view.");
             navigate('/report'); // Fallback
          }
      } else {
          navigate('/report');
      }
  };

  // --- RENDER STAGES ---

  if (step === 'input') {
    return (
      <div className="max-w-3xl mx-auto p-4 pb-32 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-2">
                 <button onClick={goBackHome} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
                     <ArrowLeft size={24}/>
                 </button>
                 <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t.start}
                 </h2>
             </div>
             {/* Subtle Auto-Save Indicator */}
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${saveStatus === 'saving' ? 'bg-blue-50 text-medical-blue border border-blue-100 opacity-100' : 'bg-transparent text-gray-400 border border-transparent opacity-80'}`}>
                {saveStatus === 'saving' ? (
                    <>
                        <Loader2 size={12} className="animate-spin text-medical-blue"/>
                        <span>Syncing...</span>
                    </>
                ) : (
                    <>
                        <Cloud size={12} />
                        <span>Draft Saved</span>
                    </>
                )}
            </div>
        </div>

        {/* Media Upload Section */}
        <section className={`p-6 rounded-3xl shadow-sm border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-medical-blue">
                    <ImageIcon size={24} />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t.upload}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.media_instruction}</p>
                </div>
            </div>
            
            {/* 2x2 Media Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Column 1: Photos */}
                <div className="flex flex-col gap-2 h-40">
                    <label className={`flex-1 relative group flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-medical-blue hover:bg-gray-700' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-medical-blue'}`}>
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                            <ImageIcon size={18} className="text-medical-blue"/>
                        </div>
                        <span className="font-semibold text-sm text-medical-blue">{t.photo}</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange}/>
                    </label>
                    <button 
                        onClick={startPhotoSession}
                        className={`flex-1 relative group flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-700' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400'}`}
                    >
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                            <Camera size={18} className="text-blue-500"/>
                        </div>
                        <span className="font-semibold text-sm text-blue-500">{t.take_photo}</span>
                    </button>
                </div>
                
                {/* Column 2: Videos */}
                 <div className="flex flex-col gap-2 h-40">
                     <label className={`flex-1 relative group flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-medical-blue hover:bg-gray-700' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-medical-blue'}`}>
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                            <VideoIcon size={18} className="text-medical-blue"/>
                        </div>
                        <span className="font-semibold text-sm text-medical-blue">{t.video}</span>
                        <input type="file" accept="video/*" className="hidden" onChange={handleFileChange}/>
                    </label>
                    <button 
                        onClick={startVideoRecording}
                        className={`flex-1 relative group flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-red-500 hover:bg-gray-700' : 'border-red-200 bg-red-50/30 hover:bg-red-50 hover:border-red-500'}`}
                    >
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                            <VideoIcon size={18} className="text-red-500"/>
                        </div>
                        <span className="font-semibold text-sm text-red-500">{t.start_video}</span>
                    </button>
                 </div>
            </div>
            
            {isCompressing && (
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-4 overflow-hidden">
                    <div className="bg-medical-blue h-full rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                </div>
            )}
            
            {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-6">
                    {previews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border dark:border-gray-600 shadow-sm group bg-black">
                            {isVideo(i) ? (
                                <video src={src} className="w-full h-full object-cover" />
                            ) : (
                                <img src={src} alt="preview" className="w-full h-full object-cover" />
                            )}
                            <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                                <X size={12} />
                            </button>
                            {isVideo(i) && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Play size={24} className="text-white opacity-80" fill="white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* Symptoms Section */}
        <section className={`p-6 rounded-3xl shadow-sm border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                    <Mic size={24} />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t.describe_symptoms}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.tap_mic}</p>
                </div>
             </div>

             <div className="relative">
                 <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isRecording ? "Listening..." : t.symptom_placeholder}
                    className={`w-full min-h-[160px] p-5 rounded-2xl text-lg outline-none resize-none transition-all ${darkMode ? 'bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:border-purple-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:bg-white focus:ring-2 ring-purple-100 focus:border-purple-400'}`}
                 />
                 <button 
                    onClick={toggleRecording} 
                    className={`absolute bottom-4 right-4 p-4 rounded-full font-bold flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${isRecording ? 'bg-urgent-red text-white animate-pulse' : 'bg-medical-blue text-white'}`}
                >
                    <Mic size={28} /> 
                </button>
             </div>

             {/* Duration & Pain Grid */}
             <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="space-y-2">
                     <label className={`text-sm font-semibold ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.duration}</label>
                     <select 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)}
                        className={`w-full p-3 rounded-xl border appearance-none outline-none font-medium ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                     >
                         {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                 </div>
                 <div className="space-y-2">
                     <label className={`text-sm font-semibold ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.pain}: {painLevel}</label>
                     <input 
                        type="range" min="1" max="10" 
                        value={painLevel} 
                        onChange={(e) => setPainLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medical-blue"
                     />
                 </div>
             </div>
        </section>

        {/* Live Video Recording Overlay */}
        {isRecordingVideo && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between py-8">
                 <div className="w-full flex justify-between px-6 items-start z-10">
                     <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 text-white font-bold animate-pulse">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                         REC
                     </div>
                     <div className="bg-black/50 px-3 py-1 rounded-full text-white font-mono">
                         {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')} / 1:00
                     </div>
                 </div>
                 
                 {/* Video Preview */}
                 <div className="absolute inset-0 w-full h-full bg-black">
                     <video 
                        ref={liveVideoRef} 
                        className="w-full h-full object-cover" 
                        muted 
                        autoPlay 
                        playsInline 
                     />
                 </div>
                 
                 <div className="z-10 w-full px-8 pb-8 flex flex-col items-center gap-4">
                     <p className="text-white bg-black/50 px-4 py-2 rounded-lg text-center backdrop-blur-sm">
                        {t.recording_time_limit}
                     </p>
                     <button 
                        onClick={stopVideoRecording}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                     >
                         <div className="w-16 h-16 bg-red-600 rounded-xl"></div>
                     </button>
                     <p className="text-white font-bold">{t.stop_video}</p>
                 </div>
            </div>
        )}

        {/* Live Photo Overlay */}
        {isTakingPhoto && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between py-8">
                 <div className="w-full flex justify-between px-6 items-start z-10">
                     <button onClick={stopPhotoSession} className="bg-black/50 p-2 rounded-full text-white">
                         <X size={24}/>
                     </button>
                 </div>
                 
                 <div className="absolute inset-0 w-full h-full bg-black">
                     <video 
                        ref={photoVideoRef} 
                        className="w-full h-full object-cover" 
                        muted 
                        autoPlay 
                        playsInline 
                     />
                 </div>
                 
                 <div className="z-10 w-full px-8 pb-8 flex flex-col items-center gap-4">
                     <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                     >
                         <div className="w-16 h-16 bg-white rounded-full"></div>
                     </button>
                     <p className="text-white font-bold">{t.capture}</p>
                 </div>
            </div>
        )}

        {/* Action Button */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
                <button 
                    onClick={handleAnalyze}
                    disabled={files.length === 0 && textInput.length === 0}
                    className="w-full bg-gradient-to-r from-medical-blue to-blue-600 text-white py-4 rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none touch-target active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <span>{navigator.onLine ? t.analyze : "Save Offline"}</span>
                    <ArrowRight size={24} />
                </button>
                {(files.length === 0 && textInput.length === 0) && (
                    <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t.analyze_disabled_hint}
                    </p>
                )}
            </div>
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-12 animate-in fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-medical-blue opacity-10 rounded-full animate-ping duration-[2000ms]"></div>
                <div className="absolute inset-2 bg-medical-blue opacity-20 rounded-full animate-ping duration-[1500ms]"></div>
                <div className="relative z-10 p-8 bg-white dark:bg-gray-800 rounded-full shadow-2xl border-4 border-medical-blue/20">
                    <Loader2 size={64} className="text-medical-blue animate-spin" />
                </div>
              </div>
              
              <div className="space-y-6 max-w-sm mx-auto">
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t.analyzing}</h2>
                  <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border dark:border-gray-700 animate-pulse">
                          <ImageIcon className="text-medical-blue"/> <span className="font-medium dark:text-gray-300">Scanning visuals...</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border dark:border-gray-700 animate-pulse delay-300">
                          <Stethoscope className="text-green-500"/> <span className="font-medium dark:text-gray-300">Checking symptoms...</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border dark:border-gray-700 animate-pulse delay-700">
                          <Activity className="text-purple-500"/> <span className="font-medium dark:text-gray-300">Generating report...</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (step === 'success') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 space-y-8 animate-in zoom-in duration-500">
              <div className="bg-green-100 dark:bg-green-900/30 p-8 rounded-full shadow-lg ring-8 ring-green-50 dark:ring-green-900/10">
                  <PartyPopper size={80} className="text-safe-green" />
              </div>
              <div className="space-y-3">
                  <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.success_title}</h2>
                  <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.success_subtitle}</p>
              </div>
          </div>
      );
  }

  if (step === 'results' && analysisResult) {
      const urgency = analysisResult.diagnoses[0].urgency;
      const isUrgent = urgency === 'URGENT';
      const mainDiag = analysisResult.diagnoses[0];
      const visual = analysisResult.visualAnalysis;

      return (
        <div id="report-content" className="pb-28 max-w-4xl mx-auto p-4 space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 mb-2">
                 <button onClick={() => setStep('input')} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
                     <ArrowLeft size={24}/>
                 </button>
                 <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Results</h2>
            </div>

            {/* 1. Urgency Banner */}
            <div className={`p-6 rounded-3xl border-l-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 border-urgent-red text-urgent-red' : 'bg-green-50 dark:bg-green-900/20 border-safe-green text-safe-green'}`}>
                <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full ${isUrgent ? 'bg-red-100 dark:bg-red-800' : 'bg-green-100 dark:bg-green-800'}`}>
                        {isUrgent ? <AlertTriangle size={32} strokeWidth={2.5}/> : <CheckCircle size={32} strokeWidth={2.5}/>}
                     </div>
                     <div>
                        <h3 className="text-xl font-bold uppercase tracking-wide leading-none mb-1">{isUrgent ? "Action Required" : "Stable Condition"}</h3>
                        <p className={`text-sm opacity-90 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {isUrgent ? "Please consult a doctor within 24 hours." : "Condition appears manageable at home."}
                        </p>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2. Visual Evidence */}
                <div className={`rounded-3xl p-4 shadow-sm border flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <ImageIcon size={20} className="text-medical-blue"/> {t.visual_evidence}
                        </h4>
                        <div className="flex gap-2">
                            <button onClick={() => setShowOverlay(!showOverlay)} className={`text-xs px-2 py-1 rounded border font-bold ${showOverlay ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                                {showOverlay ? t.hide_overlay : t.show_overlay}
                            </button>
                        </div>
                    </div>

                    {previews.length > 0 ? (
                        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden group">
                             {/* Media Viewer */}
                             {isVideo(activeImageIndex) ? (
                                <video 
                                    ref={videoRef}
                                    key={activeImageIndex} // Force re-mount
                                    src={previews[activeImageIndex]} 
                                    controls 
                                    className="w-full h-full object-contain"
                                    style={{ transform: `scale(${zoomLevel})` }}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                />
                             ) : (
                                <>
                                    <img 
                                        src={previews[activeImageIndex]} 
                                        className="w-full h-full object-contain transition-transform duration-300" 
                                        style={{ transform: `scale(${zoomLevel})` }}
                                        alt="Analysis Target"
                                    />
                                    <div className="absolute inset-0 w-full h-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}>
                                        {renderBoundingBoxes(analysisResult.boundingBoxes)}
                                    </div>
                                </>
                             )}
                             
                             {!isVideo(activeImageIndex) && (
                                <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                    <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="p-2 bg-black/60 text-white rounded-full backdrop-blur hover:bg-black/80"><ZoomOut size={16}/></button>
                                    <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))} className="p-2 bg-black/60 text-white rounded-full backdrop-blur hover:bg-black/80"><ZoomIn size={16}/></button>
                                </div>
                             )}

                             {previews.length > 1 && (
                                 <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                                     <button 
                                        onClick={() => setActiveImageIndex(prev => Math.max(0, prev - 1))}
                                        className="p-2 bg-black/60 text-white rounded-full backdrop-blur disabled:opacity-30"
                                        disabled={activeImageIndex === 0}
                                     >
                                         <ChevronLeft size={16}/>
                                     </button>
                                     <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center">{activeImageIndex + 1}/{previews.length}</span>
                                     <button 
                                        onClick={() => setActiveImageIndex(prev => Math.min(previews.length - 1, prev + 1))}
                                        className="p-2 bg-black/60 text-white rounded-full backdrop-blur disabled:opacity-30"
                                        disabled={activeImageIndex === previews.length - 1}
                                     >
                                         <ChevronRightIcon size={16}/>
                                     </button>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            {t.no_image}
                        </div>
                    )}
                    
                    {/* Findings List */}
                    {analysisResult.boundingBoxes.length > 0 && !isVideo(activeImageIndex) && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                             <h5 className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detailed Findings</h5>
                             <div className="space-y-2">
                                 {analysisResult.boundingBoxes.map((box, i) => (
                                     <div 
                                        key={i} 
                                        onClick={() => { setSelectedBoxIndex(i); triggerHaptic(); }}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedBoxIndex === i ? (darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
                                     >
                                         <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${selectedBoxIndex === i ? 'bg-medical-blue text-white' : 'bg-gray-200 text-gray-600'}`}>
                                             {i + 1}
                                         </span>
                                         <div className="flex-1">
                                             <div className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{box.label}</div>
                                             <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{box.confidence}% Confidence</div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* 3. Clinical Assessment */}
                <div className={`rounded-3xl p-6 shadow-sm border flex flex-col h-auto min-h-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h5 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.primary_diagnosis}</h5>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${mainDiag.likelihood > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {mainDiag.likelihood}% {t.confidence}
                            </div>
                        </div>
                        <h2 className={`text-3xl font-bold mb-1 break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{mainDiag.localName}</h2>
                        <h3 className={`text-lg font-medium mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{mainDiag.name}</h3>

                        <div className={`p-4 rounded-2xl mb-6 overflow-visible ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                             <p className={`text-lg leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                 {mainDiag.explanation}
                             </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h5 className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.recommendation}</h5>
                                <p className={`font-medium flex gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0"/> {mainDiag.recommendation}
                                </p>
                            </div>
                            {analysisResult.homeRemedies && !isUrgent && (
                                <div>
                                    <h5 className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.home_care}</h5>
                                    <p className={`font-medium flex gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        <Info size={18} className="text-blue-500 mt-0.5 shrink-0"/> {analysisResult.homeRemedies[0]}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Visual Insights */}
                    {visual && (
                        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                <Eye size={20} className="text-purple-500"/> Advanced Visual Insights
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                    <span className="text-xs uppercase font-bold opacity-60 block mb-1">Detected Area</span>
                                    <span className="font-medium text-sm">{visual.detectedBodyPart}</span>
                                </div>
                                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                    <span className="text-xs uppercase font-bold opacity-60 block mb-1">Visual Severity</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${visual.severityScore > 7 ? 'bg-red-500' : (visual.severityScore > 4 ? 'bg-yellow-500' : 'bg-green-500')}`} style={{width: `${visual.severityScore * 10}%`}}></div>
                                        </div>
                                        <span className="text-xs font-bold">{visual.severityScore}/10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

             {/* 4. Chat Interface */}
             <div className={`rounded-3xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h4 className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        <MessageSquare size={20} className="text-medical-blue"/> Chat with AI Doctor
                    </h4>
                </div>
                <div className="h-64 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-medical-blue text-white'}`}>
                                {msg.sender === 'user' ? <User size={16}/> : <Bot size={16}/>}
                            </div>
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : (darkMode ? 'bg-gray-700 text-gray-200 rounded-tl-none' : 'bg-white border text-gray-800 rounded-tl-none')}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-medical-blue text-white flex items-center justify-center shrink-0"><Bot size={16}/></div>
                             <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-none">
                                 <Loader2 size={16} className="animate-spin text-gray-500"/>
                             </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a follow-up question..."
                        className={`flex-1 px-4 py-2 rounded-full border outline-none focus:ring-2 ring-blue-500/20 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'}`}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="p-2 bg-medical-blue text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            {/* 5. Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 border-t z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                 <div className="max-w-4xl mx-auto flex gap-3">
                     <button onClick={handleDownloadPDF} className="flex-[2] bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 py-4 rounded-2xl font-bold text-lg shadow-sm touch-target flex items-center justify-center gap-2 transition-colors">
                        <Download size={20} className="text-gray-600"/> Download PDF
                     </button>
                     <button onClick={() => navigate('/report')} className="flex-[2] bg-medical-blue hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg touch-target flex items-center justify-center gap-2 transition-colors">
                        {t.view_report} <FileText size={20} />
                     </button>
                 </div>
            </div>
        </div>
      );
  }

  return null;
};

export default Consultation;
