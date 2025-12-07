

import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";
import { getCache, setCache } from "./utils";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } } | null>(
    (resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  );
};

// Defined Schema for Structured Output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    boundingBoxes: {
      type: Type.ARRAY,
      description: "List of detected issues with bounding boxes on the image.",
      items: {
        type: Type.OBJECT,
        properties: {
          ymin: { type: Type.NUMBER, description: "Normalized Y min (0-1000)" },
          xmin: { type: Type.NUMBER, description: "Normalized X min (0-1000)" },
          ymax: { type: Type.NUMBER, description: "Normalized Y max (0-1000)" },
          xmax: { type: Type.NUMBER, description: "Normalized X max (0-1000)" },
          label: { type: Type.STRING, description: "Short label of the finding" },
          confidence: { type: Type.NUMBER, description: "Confidence percentage 0-100" },
          severity: { 
            type: Type.STRING, 
            enum: ['high', 'moderate', 'healing'],
            description: "high=Urgent/Severe (Red), moderate=Concern/Stable (Yellow), healing=Improving (Green)"
          }
        },
        required: ["ymin", "xmin", "ymax", "xmax", "label", "confidence", "severity"],
      },
    },
    diagnoses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Medical name in English" },
          localName: { type: Type.STRING, description: "Name in the target language" },
          explanation: { type: Type.STRING, description: "Simple, easy to understand explanation (2-3 sentences) in target language." },
          recommendation: { type: Type.STRING, description: "Actionable advice in target language" },
          likelihood: { type: Type.NUMBER, description: "Probability 0-100" },
          urgency: { type: Type.STRING, enum: ["URGENT", "NON-URGENT"] },
        },
        required: ["name", "localName", "explanation", "recommendation", "likelihood", "urgency"],
      },
    },
    overallExplanation: { type: Type.STRING, description: "Simple summary for the patient in target language" },
    homeRemedies: { type: Type.ARRAY, items: { type: Type.STRING } },
    doctorWarning: { type: Type.STRING, description: "Specific warning signs to watch for (in target language)" },
    recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
    estimatedArea: { type: Type.STRING, description: "Estimated physical area of the issue (e.g., '15 cm²' or 'size of a coin')"},
    progressionAnalysis: {
        type: Type.OBJECT,
        properties: {
            comparisonComment: { type: Type.STRING, description: "If multiple images are present, describe the change/progression." },
            improvementPercentage: { type: Type.STRING, description: "Estimated change percentage (e.g. '30% reduction'). Returns 'N/A' if only one image." }
        }
    },
    visualDiagramQuery: { type: Type.STRING, description: "A specific prompt to generate a simple, educational medical cartoon diagram explaining this condition." },
    reasoningChain: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step logic of how AI reached the conclusion." },
    videoTimeline: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                time: { type: Type.STRING, description: "Timestamp e.g. '0:05'" },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['high', 'moderate', 'low'] }
            }
        }
    },
    explainability: {
        type: Type.OBJECT,
        properties: {
            factorWeights: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { factor: { type: Type.STRING }, weight: { type: Type.NUMBER } } 
                } 
            },
            imageFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceFactors: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { reason: { type: Type.STRING }, impact: { type: Type.STRING, enum: ['positive', 'negative'] } }
                }
            },
            medicalReferences: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    },
    decisionTree: {
        type: Type.OBJECT,
        description: "Root node of the decision tree",
        properties: {
            node: { type: Type.STRING },
            result: { type: Type.STRING },
            evidence: { type: Type.STRING }
        }
    },
    confidenceBreakdown: {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            level: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            missingDataImpact: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    },
    comparativeAnalysis: {
        type: Type.OBJECT,
        properties: {
            similarCasesCount: { type: Type.NUMBER },
            similarCasesOutcome: { type: Type.STRING },
            referenceGuidelines: { type: Type.STRING }
        }
    },
    visualAnalysis: {
        type: Type.OBJECT,
        description: "Detailed analysis of specific visual features.",
        properties: {
            detectedBodyPart: { type: Type.STRING },
            conditionType: { type: Type.STRING, enum: ['Skin', 'Wound', 'Eye', 'Oral', 'Musculoskeletal', 'Other'] },
            severityScore: { type: Type.NUMBER, description: "Scale 1-10" },
            symmetryComparison: { type: Type.STRING, description: "Comparison of left/right sides if applicable." },
            environmentalFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            skinAttributes: { 
                type: Type.OBJECT, 
                properties: { tone: { type: Type.STRING }, texture: { type: Type.STRING }, pattern: { type: Type.STRING } }
            },
            woundAttributes: {
                type: Type.OBJECT,
                properties: { type: { type: Type.STRING }, healingStage: { type: Type.STRING }, infectionRisk: { type: Type.STRING } }
            },
            eyeAttributes: {
                type: Type.OBJECT,
                properties: { redness: { type: Type.BOOLEAN }, discharge: { type: Type.BOOLEAN }, pupilStatus: { type: Type.STRING } }
            },
            oralAttributes: {
                type: Type.OBJECT,
                properties: { tissueHealth: { type: Type.STRING }, abnormality: { type: Type.STRING } }
            }
        }
    }
  },
  required: ["boundingBoxes", "diagnoses", "overallExplanation", "recommendedTests", "estimatedArea", "visualDiagramQuery"],
};

export const analyzeMedicalData = async (
  files: File[],
  symptoms: string,
  metaData: string,
  language: Language
): Promise<AnalysisResult> => {
  try {
    // 1. Generate a Cache Key based on inputs
    // In a real app, hash the file contents. Here using name+size approximation.
    const fileHash = files.map(f => `${f.name}_${f.size}`).join('|');
    const cacheKey = `analyze_${language}_${symptoms.substring(0, 20)}_${fileHash}`;
    
    // 2. Check Cache
    const cachedResult = getCache<AnalysisResult>(cacheKey);
    if (cachedResult) {
        console.log("Serving from cache");
        return cachedResult;
    }

    const mediaParts = await Promise.all(files.map(fileToGenerativePart));
    const validMediaParts = mediaParts.filter((p) => p !== null) as any[];

    const prompt = `
      Act as an expert AI medical consultant for rural India using Gemini 3's advanced vision capabilities.
      Target Language Code: ${language}.
      
      Patient Symptoms: ${symptoms}
      Additional Metadata: ${metaData}

      Task:
      1. Analyze the provided images/video frames visually using pixel-precise detection.
      2. Perform specific analysis based on image content:
         - SKIN: Analyze tone (redness/pallor), texture (bumps/scales), and pattern.
         - WOUNDS: Classify type (abrasion/laceration), assess depth, check for infection signs (pus/warmth/red streaks), and determine healing stage.
         - EYES: Check for conjunctivitis (redness), discharge, swelling.
         - ORAL: Check teeth/gums for decay or inflammation.
         - BODY: Identify the body part. Check for asymmetry (swelling).
         - ENVIRONMENT: Look for background clues (hygiene, safety risks).
      3. Return 2D bounding boxes for visual findings.
         - MARK SEVERITY: 'high' for deep wounds/infection (Red), 'moderate' for rash/swelling (Yellow), 'healing' for scabs/reduced swelling (Green).
      4. Estimate the physical area size of the affected region (e.g., "15 cm²").
      5. Provide 3 potential diagnoses ranked by likelihood.
      6. Provide explainable AI metrics: decision path, confidence breakdown, and literature references.
      7. Provide simple, culturally appropriate explanations in the target language.
      
      CRITICAL SAFETY: 
      - If the condition looks life-threatening (gangrene, severe snake bite, deep trauma, severe burns), mark as URGENT.
      - Ensure the output is strictly structured JSON.
      - Use simple, layperson terms for the explanation field.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [...validMediaParts, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are GramHealth AI, a safety-first medical assistant. Always prioritize patient safety. Output clean, structured JSON.",
        thinkingConfig: { thinkingBudget: 2048 } 
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text) as AnalysisResult;
      // 3. Set Cache
      setCache(cacheKey, result);
      return result;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const chatWithAI = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  language: Language
) => {
  try {
     const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      history: history,
      config: {
        systemInstruction: `You are a helpful medical assistant speaking in ${language}. Keep answers short, simple, and reassuring. Do not give complex medical advice, suggest seeing a doctor if unsure.`,
      }
    });
    
    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat failed", error);
    return "Error communicating with AI.";
  }
}

export const generateMedicalDiagram = async (prompt: string): Promise<string | null> => {
  try {
    const cacheKey = `diagram_${prompt}`;
    const cached = getCache<string>(cacheKey);
    if(cached) return cached;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Create a simple, clean, medical cartoon diagram: ${prompt}. White background, clear labels, educational style.` }] },
        config: {
            imageConfig: { aspectRatio: '4:3' }
        }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const dataUrl = `data:image/png;base64,${part.inlineData.data}`;
            setCache(cacheKey, dataUrl);
            return dataUrl;
        }
    }
    return null;
  } catch (e) {
      console.error("Diagram generation failed", e);
      return null;
  }
}

export const digitizePrescription = async (file: File): Promise<string> => {
    try {
        const mediaPart = await fileToGenerativePart(file);
        if (!mediaPart) throw new Error("File error");

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [mediaPart, { text: "Transcribe this handwritten medical prescription into clear, plain text. List medicines, dosages, and instructions clearly." }]
            }
        });
        return response.text || "Could not read prescription.";
    } catch (e) {
        console.error("Prescription OCR failed", e);
        return "Failed to digitize prescription.";
    }
}