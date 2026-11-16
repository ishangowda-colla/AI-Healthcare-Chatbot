# MediBot — AI Healthcare Assistant
## Final Year Project · CS&E Department · RIT Hassan · 2025–26


---

## 📋 Project Abstract

**MediBot** is a full-stack AI-powered healthcare assistant designed to provide multilingual health guidance, symptom analysis, medication management, and health tracking for rural and urban users in India. It demonstrates the application of REST API architecture, React.js SPA development, JWT authentication, SQLite persistence, and NLP-based symptom matching in a production-grade web application.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│   React.js SPA (Single Page Application)                │
│   React Router v6 · Axios · Recharts · Context API      │
└────────────────────┬────────────────────────────────────┘
                     │  HTTP / REST (JSON)
                     │  JWT Bearer Token Auth
┌────────────────────▼────────────────────────────────────┐
│                    API LAYER                            │
│   Flask REST API (Python)                               │
│   Flask-CORS · JWT (HMAC-SHA256) · Werkzeug             │
│   12 Modules · 20+ REST Endpoints                       │
└────────────────────┬────────────────────────────────────┘
                     │  SQL Queries
┌────────────────────▼────────────────────────────────────┐
│                    DATA LAYER                           │
│   SQLite Database (medibot.db)                          │
│   6 Tables: users, tablets, vitals,                     │
│             water_intake, chat_history, bmi_log         │
└─────────────────────────────────────────────────────────┘
                     +
┌─────────────────────────────────────────────────────────┐
│                  PROCESSING LAYER                       │
│   OpenCV — HSV-based skin/injury image analysis         │
│   NLP — Keyword symptom matching engine                 │
│   Language Detector — Unicode script detection          │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
medibot-fyp/
│
├── backend/                         ← Flask REST API
│   ├── app.py                       ← Main API (12 modules, 20+ endpoints)
│   ├── requirements.txt
│   └── medibot.db                   ← SQLite DB (auto-created on first run)
│
└── frontend/                        ← React SPA
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js                   ← Root component + React Router setup
    │   ├── App.css                  ← Global design system (CSS variables)
    │   ├── index.js                 ← React DOM entry point
    │   │
    │   ├── context/
    │   │   ├── AuthContext.js       ← Global auth state (login/logout/register)
    │   │   └── LangContext.js       ← Global language state (EN/HI/KN)
    │   │
    │   ├── services/
    │   │   └── api.js               ← Centralized Axios REST API service layer
    │   │
    │   ├── components/
    │   │   └── Layout.js            ← Sidebar + Header shell (wraps all pages)
    │   │
    │   └── pages/
    │       ├── LoginPage.js         ← User login
    │       ├── RegisterPage.js      ← User registration
    │       ├── DashboardPage.js     ← Overview stats + charts + quick access
    │       ├── ChatPage.js          ← AI symptom chat + voice + image
    │       ├── TabletsPage.js       ← Medicine reminder system
    │       ├── WaterPage.js         ← Hydration tracker (8-glass goal)
    │       ├── BMIPage.js           ← BMI calculator + history chart
    │       ├── VitalsPage.js        ← Health vitals logger + trend charts
    │       ├── EmergencyPage.js     ← Emergency contacts + first-aid guide
    │       └── DiseasesPage.js      ← Disease encyclopedia with details
    └── package.json
```

---

## 🔌 REST API Endpoints

### Auth Routes `/api/auth/*`
| Method | Endpoint              | Description                  | Auth |
|--------|-----------------------|------------------------------|------|
| POST   | `/api/auth/register`  | Create new user account      | ❌   |
| POST   | `/api/auth/login`     | Login → receive JWT token    | ❌   |
| GET    | `/api/auth/me`        | Get current user profile     | ✅   |

### Chat Routes `/api/chat`
| Method | Endpoint              | Description                  | Auth |
|--------|-----------------------|------------------------------|------|
| POST   | `/api/chat`           | Symptom analysis (NLP)       | ✅   |
| GET    | `/api/chat/history`   | Get user's chat history      | ✅   |
| DELETE | `/api/chat/history`   | Clear chat history           | ✅   |

### Tablet Routes `/api/tablets`
| Method | Endpoint              | Description                  | Auth |
|--------|-----------------------|------------------------------|------|
| GET    | `/api/tablets`        | Get today's tablets          | ✅   |
| POST   | `/api/tablets`        | Add new tablet reminder      | ✅   |
| PATCH  | `/api/tablets/:id`    | Toggle taken status          | ✅   |
| DELETE | `/api/tablets/:id`    | Delete tablet                | ✅   |

### Water Routes `/api/water`
| Method | Endpoint  | Description                     | Auth |
|--------|-----------|---------------------------------|------|
| GET    | `/api/water` | Get today's water intake     | ✅   |
| PUT    | `/api/water` | Update glass count           | ✅   |

### BMI Routes `/api/bmi`
| Method | Endpoint          | Description               | Auth |
|--------|-------------------|---------------------------|------|
| POST   | `/api/bmi`        | Calculate + save BMI      | ✅   |
| GET    | `/api/bmi/history`| Get BMI history           | ✅   |

### Vitals Routes `/api/vitals`
| Method | Endpoint      | Description               | Auth |
|--------|---------------|---------------------------|------|
| GET    | `/api/vitals` | Get vitals + history      | ✅   |
| POST   | `/api/vitals` | Log new vitals entry      | ✅   |

### Misc Routes
| Method | Endpoint              | Description                  | Auth |
|--------|-----------------------|------------------------------|------|
| POST   | `/api/analyze-image`  | Skin/injury image analysis   | ✅   |
| GET    | `/api/tips?lang=en`   | Get health tips              | ❌   |
| GET    | `/api/diseases`       | List all diseases            | ❌   |
| GET    | `/api/diseases/:name` | Get disease details          | ❌   |
| GET    | `/api/dashboard`      | Aggregated user stats        | ✅   |
| GET    | `/api/health`         | API health check             | ❌   |

---

## 🧠 Key Technical Features

### 1. JWT Authentication (Stateless)
- HMAC-SHA256 signed tokens (no external library)
- 7-day expiry with automatic refresh
- Auto-redirect to login on 401 responses (Axios interceptor)

### 2. NLP Symptom Matching Engine
- Keyword-based matching against disease knowledge base
- Scored ranking — top 3 matches returned
- Supports English, Hindi (Devanagari + transliterated), Kannada

### 3. Language Detection
- Unicode character range detection (Devanagari U+0900–U+097F, Kannada U+0C80–U+0CFF)
- Transliterated Hindi/Kannada keyword fallback

### 4. Image Analysis (OpenCV)
- HSV color space analysis for skin condition detection
- Detects: Redness/Inflammation, Bruising, Jaundice, Normal
- Returns severity classification and advice

### 5. React Architecture
- Context API for global state (auth + language)
- Axios interceptors for automatic JWT injection and 401 handling
- React Router v6 with protected routes (PrivateRoute wrapper)
- Recharts for interactive data visualization

### 6. SQLite Persistence (6 Tables)
- `users` — Authentication credentials
- `tablets` — Daily medication reminders (per user, per date)
- `vitals` — Health metric history
- `water_intake` — Daily hydration tracking (UPSERT pattern)
- `chat_history` — Conversation logs
- `bmi_log` — BMI calculation history

---

## 🚀 Setup & Running

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000
# → API docs: http://localhost:5000/api/health
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

**Note:** The `"proxy": "http://localhost:5000"` in `package.json` routes all `/api/*` calls to Flask automatically during development.

---

## 🌐 Languages Supported

| Language | Script Detection         | Transliteration |
|----------|--------------------------|-----------------|
| English  | Latin (default)          | —               |
| हिंदी   | U+0900–U+097F (Devanagari) | bukhar, dard, khasi… |
| ಕನ್ನಡ   | U+0C80–U+0CFF (Kannada)  | tapamana, novu… |

---

## 🩺 Disease Knowledge Base (10 Diseases)

| Disease      | Severity | Symptoms Tracked |
|--------------|----------|-----------------|
| Malaria      | High     | 10              |
| Common Cold  | Low      | 10              |
| Diabetes     | High     | 9               |
| Hypertension | High     | 9               |
| Allergy      | Medium   | 9               |
| Acne         | Low      | 8               |
| Typhoid      | High     | 8               |
| COVID-19     | High     | 8               |
| Dengue       | High     | 8               |
| Anemia       | Medium   | 8               |

---

## 🖥️ Application Pages

| Page         | Route        | Features                                              |
|--------------|--------------|-------------------------------------------------------|
| Login        | `/login`     | JWT auth, form validation                             |
| Register     | `/register`  | New account creation                                  |
| Dashboard    | `/`          | Stats cards, BMI chart, vitals, quick access          |
| AI Chat      | `/chat`      | Symptom NLP, voice input, image upload, chat history  |
| Tablets      | `/tablets`   | CRUD reminders, progress bar, usage guide             |
| Water        | `/water`     | 8-glass tracker, visual glasses, benefits info        |
| BMI          | `/bmi`       | Calculator, range chart, history trend (Recharts)     |
| Vitals       | `/vitals`    | Multi-metric logger, trend line chart                 |
| Emergency    | `/emergency` | Clickable phone numbers, first-aid procedures         |
| Diseases     | `/diseases`  | Searchable encyclopedia, filterable, detail panel     |

---

## 👥 Team

| Name                | Role                          |
|-------------        |-------------------------------|
| [Nikhil A R]        | Backend API & Database        |
| [Chidu Kumar H K]   | NLP Engine & Image Analysis       |
| [Darshan Gowda S S] | Frontend & UI/UX   |
| [Farhan Yunus]      | Testing & Documentation       |

**Guide:** [Mrs Nanditha S R], CS&E Dept, RIT Hassan

---

## 📚 Technologies Used

| Category       | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React.js 18, React Router v6      |
| State          | Context API (Auth + Lang)         |
| HTTP Client    | Axios with interceptors           |
| Charts         | Recharts (Line, Area)             |
| Backend        | Flask 3.0 (Python)                |
| Auth           | JWT (HMAC-SHA256, no lib)         |
| Database       | SQLite (via sqlite3 stdlib)       |
| CORS           | Flask-CORS                        |
| Image          | OpenCV (HSV analysis)             |
| Voice          | Web Speech API (Browser native)   |
| TTS            | SpeechSynthesis API (Browser)     |
| Fonts          | Google Fonts (Sora, Noto Sans)    |

---

## ⚠️ Disclaimer

MediBot is built for educational purposes as a Final Year Project.
It provides general health information only and is **NOT a substitute**
for professional medical advice, diagnosis, or treatment.
Always consult a qualified healthcare provider.
