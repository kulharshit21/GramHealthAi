
export type Language = 'en' | 'hi' | 'ta' | 'bn' | 'mr' | 'kn';

export interface PermissionState {
  camera: boolean;
  microphone: boolean;
  completed: boolean;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
  confidence: number;
  severity: 'high' | 'moderate' | 'healing';
}

export interface Diagnosis {
  name: string;
  localName: string;
  explanation: string;
  recommendation: string;
  likelihood: number;
  urgency: 'URGENT' | 'NON-URGENT';
  pronunciation?: string;
}

export interface ProgressionAnalysis {
  comparisonComment: string;
  improvementPercentage: string;
}

export interface VideoTimelineEvent {
    time: string;
    description: string;
    severity: 'high' | 'moderate' | 'low';
}

export interface MotionMetric {
    name: string;
    value: number; // 0-100 or specific unit
    unit: string;
    status: 'normal' | 'warning' | 'abnormal';
}

export interface Explainability {
    factorWeights: { factor: string; weight: number }[]; // Image vs Text vs History
    imageFocusAreas: string[]; // "Upper right quadrant", "Center wound"
    confidenceFactors: { reason: string; impact: 'positive' | 'negative' }[];
    medicalReferences: string[];
}

export interface DecisionPath {
    node: string; // "Swelling Detected?"
    result: string; // "YES"
    evidence: string; // "Image bounding box #1"
    next?: DecisionPath;
}

export interface ConfidenceBreakdown {
    score: number;
    level: 'Low' | 'Medium' | 'High';
    missingDataImpact: string[]; // "No video provided (-15%)"
    improvementSuggestions: string[]; // "Upload video for better accuracy"
}

export interface ComparativeAnalysis {
    similarCasesCount: number;
    similarCasesOutcome: string; // "80% recovered with home care"
    referenceGuidelines: string; // "WHO Guidelines for Cellulitis"
}

export interface UserHealthStats {
    totalConsultations: number;
    mostCommonConditions: { name: string; count: number }[];
    recoveryRate: number; // days
    consistencyScore: number; // 0-100
}

export interface DetailedVisualAnalysis {
  detectedBodyPart: string;
  conditionType: 'Skin' | 'Wound' | 'Eye' | 'Oral' | 'Musculoskeletal' | 'Other';
  severityScore: number; // 1-10
  
  // Specific findings
  skinAttributes?: { tone: string; texture: string; pattern: string };
  woundAttributes?: { type: string; healingStage: string; infectionRisk: string };
  eyeAttributes?: { redness: boolean; discharge: boolean; pupilStatus: string };
  oralAttributes?: { tissueHealth: string; abnormality: string };
  
  // General
  symmetryComparison?: string; // "Right side is 20% larger than left"
  environmentalFactors?: string[]; // "Poor hygiene indicators", "Outdoor setting"
}

export interface AnalysisResult {
  boundingBoxes: BoundingBox[];
  diagnoses: Diagnosis[];
  overallExplanation: string;
  homeRemedies?: string[];
  doctorWarning?: string;
  recommendedTests: string[];
  estimatedArea?: string;
  progressionAnalysis?: ProgressionAnalysis;
  visualDiagramQuery?: string;
  reasoningChain?: string[];
  
  // Video specific
  videoTimeline?: VideoTimelineEvent[];
  motionMetrics?: MotionMetric[];
  videoSummary?: string;

  // Analytics & Transparency
  explainability?: Explainability;
  decisionTree?: DecisionPath;
  confidenceBreakdown?: ConfidenceBreakdown;
  comparativeAnalysis?: ComparativeAnalysis;

  // Advanced Vision
  visualAnalysis?: DetailedVisualAnalysis;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  audioUrl?: string;
}

export interface PatientData {
  symptoms: string;
  duration: string;
  painLevel: number; 
  otherSymptoms: string[]; 
  mediaFiles: File[];
  timestamp?: number;
}

export interface DoctorNote {
  id: string;
  doctorId: string;
  doctorName: string;
  text: string;
  timestamp: number;
  prescriptionImage?: string; // Base64
  prescriptionText?: string;
}

export interface ConsultationRecord {
    id: string;
    date: number;
    patientData: PatientData;
    analysisResult: AnalysisResult;
    shareCode?: string; // e.g., "GH-2025-ABC"
    doctorNotes?: DoctorNote[];
}

export interface Caregiver {
    id: string;
    name: string;
    relation: string;
    accessLevel: 'full_access' | 'view_only';
    phone: string;
}

// --- Collaborative Types ---

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  fee: number; // in INR
  isOnline: boolean;
  imageUrl: string;
}

export const LANGUAGES: Record<Language, { label: string; flag: string; code: string }> = {
  en: { label: 'English', flag: '🇬🇧', code: 'en-US' },
  hi: { label: 'हिंदी', flag: '🇮🇳', code: 'hi-IN' },
  ta: { label: 'தமிழ்', flag: '🇮🇳', code: 'ta-IN' },
  bn: { label: 'বাংলা', flag: '🇮🇳', code: 'bn-IN' },
  mr: { label: 'मराठी', flag: '🇮🇳', code: 'mr-IN' },
  kn: { label: 'ಕನ್ನಡ', flag: '🇮🇳', code: 'kn-IN' },
};
