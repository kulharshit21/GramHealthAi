# 🏥 GramHealth AI

<div align="center">

**A Comprehensive Multilingual Medical Consultation App for Rural India**

[![React](https://img.shields.io/badge/React-19.2.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4.svg)](https://ai.google.dev/)

*Connecting Rural India to Healthcare through AI-powered preliminary medical assessments*

</div>

---

## 📖 Overview

GramHealth AI is a cutting-edge healthcare application designed to bridge the healthcare gap in rural India. Using Google's Gemini AI, the app provides preliminary medical assessments through image analysis, video analysis, and voice-based symptom reporting. The application supports multiple Indian languages and offers an accessible, offline-capable solution for communities with limited access to healthcare facilities.

### 🎯 Key Features

- **🤖 AI-Powered Diagnosis**: Leverages Gemini 1.5 Pro for advanced medical image and video analysis
- **🌐 Multilingual Support**: Available in 6 languages - English, Hindi, Tamil, Bengali, Marathi, and Kannada
- **📸 Visual Analysis**: Upload photos or videos of symptoms for detailed AI assessment
- **🎙️ Voice Input**: Speak symptoms in your native language for hands-free consultation
- **♿ Accessibility First**: 
  - Adjustable font sizes (100%, 125%, 150%)
  - Dark mode support
  - High contrast mode
  - Screen reader friendly
- **📊 Detailed Reports**: 
  - Bounding box detection on images
  - Severity assessment with color-coded indicators
  - Home remedies and doctor visit recommendations
  - Confidence breakdown and explainability
- **📱 Progressive Web App**: Works offline and can be installed on mobile devices
- **👨‍⚕️ Doctor Portal**: Share consultation codes with healthcare professionals
- **📈 Health History**: Track past consultations and progression analysis
- **🔒 Privacy-Focused**: Local data storage with optional sharing

---

## 🏗️ Project Structure

```
GramHealthAi/
│
├── 📄 index.html              # Main HTML entry point with Tailwind CDN
├── 📄 index.tsx               # React app entry point
├── 📄 App.tsx                 # Main app component with routing and context
├── 📄 package.json            # Project dependencies and scripts
├── 📄 vite.config.ts          # Vite configuration
├── 📄 tsconfig.json           # TypeScript configuration
├── 📄 metadata.json           # App metadata and permissions
├── 📄 types.ts                # TypeScript type definitions
├── 📄 constants.ts            # App constants and translations
├── 📄 .gitignore              # Git ignore rules
│
├── 📁 pages/                  # Application pages
│   ├── Home.tsx               # Home page with consultation history
│   ├── Consultation.tsx       # Main consultation interface
│   ├── Report.tsx             # Detailed analysis report viewer
│   ├── DoctorPortal.tsx       # Doctor collaboration interface
│   ├── FamilyAccess.tsx       # Family/caregiver access management
│   └── Community.tsx          # Community features
│
├── 📁 components/             # Reusable React components
│   ├── PermissionScreen.tsx   # Camera/microphone permission handler
│   └── LazyImage.tsx          # Lazy-loaded image component
│
└── 📁 services/               # Business logic and API services
    ├── geminiService.ts       # Gemini AI integration
    └── utils.ts               # Utility functions (caching, haptics, TTS)
```

### 📂 Key Directories Explained

#### **`pages/`** - Application Routes
- **Home.tsx**: Landing page displaying consultation history with pagination and delete functionality
- **Consultation.tsx**: Core consultation flow - symptom input, media upload, voice recording
- **Report.tsx**: Comprehensive analysis results with visual overlays and recommendations
- **DoctorPortal.tsx**: Interface for healthcare professionals to review shared consultations
- **FamilyAccess.tsx**: Manage caregiver permissions and family member access
- **Community.tsx**: Community health features and discussion forums

#### **`components/`** - Reusable UI Components
- **PermissionScreen.tsx**: Handles browser permissions for camera and microphone with educational UI
- **LazyImage.tsx**: Performance-optimized image loading component

#### **`services/`** - Core Business Logic
- **geminiService.ts**: 
  - Handles Gemini AI API integration
  - Implements structured output schema for medical analysis
  - Supports image, video, and text-based consultations
  - Includes caching for improved performance
- **utils.ts**:
  - Text-to-speech functionality
  - Haptic feedback utilities
  - Local storage caching mechanism
  - Language-specific voice synthesis

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.1** - Modern React with concurrent features
- **TypeScript 5.8.2** - Type-safe development
- **React Router DOM 7.10.1** - Client-side routing
- **Vite 6.2.0** - Lightning-fast build tool and dev server

### UI & Styling
- **Tailwind CSS 3.x** - Utility-first CSS framework (via CDN)
- **Lucide React 0.556.0** - Beautiful, consistent icons
- **Custom CSS** - Glassmorphism effects, animations, accessibility features

### AI & APIs
- **Google Gemini AI (@google/genai 1.31.0)** - Multimodal AI for medical analysis
- **Web Speech API** - Voice input and text-to-speech
- **MediaDevices API** - Camera and microphone access
- **Canvas API** - Image manipulation and bounding boxes

### Additional Tools
- **html2pdf.js (via CDN)** - PDF report generation
- **LocalStorage API** - Offline data persistence
- **Service Worker Ready** - PWA capabilities

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Google Gemini API Key** ([Get it here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kulharshit21/GramHealthAi.git
   cd GramHealthAi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 💻 Usage Guide

### 1️⃣ Initial Setup
- Grant camera and microphone permissions when prompted
- Complete the onboarding tutorial
- Accept the medical disclaimer
- Select your preferred language

### 2️⃣ Start a Consultation
- Click **"Start New Consultation"** on the home page
- Choose your input method:
  - 📸 **Upload Photo/Video** - Capture or select media showing symptoms
  - 🎙️ **Voice Input** - Describe symptoms verbally
  - ⌨️ **Text Input** - Type symptom description

### 3️⃣ Provide Details
- Duration of symptoms
- Pain level (1-10 scale)
- Additional symptoms checklist
- Upload multiple images/videos if needed

### 4️⃣ Receive Analysis
- AI processes your input using Gemini 1.5 Pro
- View detailed diagnosis with:
  - Visual bounding boxes on detected issues
  - Severity assessment (High/Moderate/Healing)
  - Confidence scores
  - Home remedies
  - When to see a doctor
  - Recommended medical tests

### 5️⃣ Take Action
- Download PDF report
- Share with doctor via WhatsApp
- Generate consultation code for Doctor Portal
- Save to consultation history

---

## 🎨 Accessibility Features

GramHealth AI is built with accessibility as a core principle:

- **🔤 Font Scaling**: 3 sizes (Normal, Large, Extra Large)
- **🌙 Dark Mode**: Reduces eye strain in low-light conditions
- **👁️ High Contrast Mode**: Enhanced visibility for visual impairments
- **🎯 Touch Targets**: Minimum 60x60px for easy tapping
- **🗣️ Text-to-Speech**: Reads diagnoses and recommendations aloud
- **♿ Screen Reader Support**: ARIA labels and semantic HTML
- **🌐 Multilingual**: Native language support for regional users

---

## 🔐 Privacy & Security

- **Local Storage**: All data stored on device by default
- **No Mandatory Cloud Sync**: Opt-in sharing only
- **Secure API Calls**: Environment-based API key management
- **Medical Disclaimer**: Clear warnings about AI limitations
- **HIPAA Awareness**: Designed with healthcare privacy in mind

---

## 🌍 Supported Languages

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| English | `en` | English | 🇬🇧 |
| Hindi | `hi` | हिंदी | 🇮🇳 |
| Tamil | `ta` | தமிழ் | 🇮🇳 |
| Bengali | `bn` | বাংলা | 🇮🇳 |
| Marathi | `mr` | मराठी | 🇮🇳 |
| Kannada | `kn` | ಕನ್ನಡ | 🇮🇳 |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Maintain accessibility standards
- Add translations for all new UI text
- Test on multiple screen sizes
- Ensure offline functionality works

---

## 🐛 Known Issues & Limitations

- Gemini API requires internet connectivity
- Video analysis may take longer on slower connections
- Browser permission denials require manual reset
- Some languages may have limited TTS voice quality

---

## 📜 License

This project is currently **unlicensed**. Please contact the repository owner for usage permissions.

---

## 👨‍💻 Author

**Harshit Kulkarni**
- GitHub: [@kulharshit21](https://github.com/kulharshit21)

---

## 🙏 Acknowledgments

- **Google Gemini Team** - For the powerful multimodal AI API
- **React Community** - For excellent documentation and tools
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide Icons** - For beautiful, consistent iconography

---

## 📞 Support

For issues, questions, or suggestions:
- 📧 Open an [Issue](https://github.com/kulharshit21/GramHealthAi/issues)
- 💬 Start a [Discussion](https://github.com/kulharshit21/GramHealthAi/discussions)

---

<div align="center">

**Made with ❤️ for Rural India**

*Disclaimer: This app provides preliminary assessments only. Always consult qualified healthcare professionals for medical decisions.*

</div>
