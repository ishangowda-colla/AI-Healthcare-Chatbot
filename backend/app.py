"""
MediBot — AI Healthcare Assistant
Final Year Project · REST API Backend
Flask + SQLite + JWT Authentication
RIT Hassan · CS&E Dept · 2024-25

Architecture: REST API (Flask) ↔ React SPA Frontend
Author: [Your Name], [Team Members]
"""

import os, uuid, re, json, hashlib, datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 1 — APP CONFIG & DATABASE SETUP
# ══════════════════════════════════════════════════════════════════════════════

app = Flask(__name__)
app.config['SECRET_KEY'] = 'medibot_fyp_secret_2024'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enable CORS for all React dev origins
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# ---------- SQLite lightweight DB (no ORM needed for FYP) ----------
import sqlite3

DB_PATH = 'medibot.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    # Users table
    cur.execute("""CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        username    TEXT    UNIQUE NOT NULL,
        email       TEXT    UNIQUE NOT NULL,
        password    TEXT    NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now'))
    )""")
    # Tablets table (per user)
    cur.execute("""CREATE TABLE IF NOT EXISTS tablets (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        name        TEXT    NOT NULL,
        time        TEXT,
        taken       INTEGER DEFAULT 0,
        date        TEXT    DEFAULT (date('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    # Vitals table (per user)
    cur.execute("""CREATE TABLE IF NOT EXISTS vitals (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        temperature REAL,
        heart_rate  INTEGER,
        bp_systolic INTEGER,
        bp_diastolic INTEGER,
        spo2        REAL,
        blood_sugar REAL,
        recorded_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    # Water intake table
    cur.execute("""CREATE TABLE IF NOT EXISTS water_intake (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        glasses     INTEGER DEFAULT 0,
        date        TEXT    DEFAULT (date('now')),
        UNIQUE(user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    # Chat history table
    cur.execute("""CREATE TABLE IF NOT EXISTS chat_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        role        TEXT    NOT NULL,
        message     TEXT    NOT NULL,
        lang        TEXT    DEFAULT 'en',
        created_at  TEXT    DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    # BMI log table
    cur.execute("""CREATE TABLE IF NOT EXISTS bmi_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        weight      REAL    NOT NULL,
        height      REAL    NOT NULL,
        bmi         REAL    NOT NULL,
        category    TEXT    NOT NULL,
        recorded_at TEXT    DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    conn.commit()
    conn.close()

init_db()

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 2 — AUTH: JWT (SIMPLE STATELESS TOKENS)
# ══════════════════════════════════════════════════════════════════════════════

import base64, hmac

def make_token(user_id: int, username: str) -> str:
    payload = json.dumps({"user_id": user_id, "username": username,
                          "exp": (datetime.datetime.utcnow() +
                                  datetime.timedelta(days=7)).isoformat()})
    enc = base64.b64encode(payload.encode()).decode()
    sig = hmac.new(app.config['SECRET_KEY'].encode(),
                   enc.encode(), hashlib.sha256).hexdigest()
    return f"{enc}.{sig}"

def verify_token(token: str):
    try:
        enc, sig = token.rsplit('.', 1)
        expected = hmac.new(app.config['SECRET_KEY'].encode(),
                            enc.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.b64decode(enc).decode())
        if datetime.datetime.fromisoformat(payload['exp']) < datetime.datetime.utcnow():
            return None
        return payload
    except Exception:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = auth.replace('Bearer ', '')
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized. Please login."}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 3 — DISEASE KNOWLEDGE BASE
# ══════════════════════════════════════════════════════════════════════════════

DISEASE_DB = {
    "malaria": {
        "symptoms": ["fever","chills","headache","sweating","nausea","vomiting",
                     "muscle pain","fatigue","bukhar","tapamana",
                     # Hindi romanized & common spellings
                     "thand","kaapna","thithurna","bukhar","malariya","maleria","sar dard",
                     "बुखार","मलेरिया","ठंड","कंपकंपी","सिरदर्द",
                     # Kannada romanized
                     "jwara","tapana","tapamana","sharira novu","maleria","masaru",
                     "ಜ್ವರ","ಮಲೇರಿಯಾ","ತಲೆನೋವು","ಬೆವರು"],
        "advice": {
            "en": "Malaria suspected. Get blood test immediately. Stay hydrated, use mosquito nets.",
            "hi": "मलेरिया की आशंका। तुरंत रक्त परीक्षण करें। पानी पीएं, मच्छरदानी उपयोग करें।",
            "kn": "ಮಲೇರಿಯಾ ಶಂಕೆ. ತಕ್ಷಣ ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿ."
        },
        "severity":"high","icon":"🦟","color":"#FF6B6B","precautions":
        ["Avoid mosquito bites","Use DEET repellent","Drain stagnant water"],
        "common_meds":["Chloroquine","Artemisinin-based therapy (doctor prescribed)"]
    },
    "common cold": {
        "symptoms": ["runny nose","sneezing","sore throat","cough","congestion",
                     "mild fever","nasal","naak","khasi","khansi",
                     # Hindi
                     "naak bahna","gala kharab","zukam","sardi","jukham","sardi",
                     "सर्दी","जुकाम","खांसी","नाक","गला","बुखार",
                     # Kannada romanized
                     "nalige","moogu","kashi","gantala novu","neegadi","tanda",
                     "ಮೂಗು ಸೋರುವಿಕೆ","ಕೆಮ್ಮು","ಗಂಟಲು","ಶೀತ","ನೆಗಡಿ"],
        "advice": {
            "en": "Rest, drink warm fluids. Honey-lemon tea helps. See doctor if fever > 101°F.",
            "hi": "आराम करें, गर्म तरल पिएं। बुखार 101°F से ऊपर हो तो डॉक्टर दिखाएं।",
            "kn": "ವಿಶ್ರಾಂತಿ ತೆಗೆಕೊಳ್ಳಿ, ಬೆಚ್ಚಗಿನ ದ್ರವ ಕುಡಿಯಿರಿ."
        },
        "severity":"low","icon":"🤧","color":"#74B9FF","precautions":
        ["Wash hands frequently","Avoid close contact","Wear mask if needed"],
        "common_meds":["Paracetamol","Antihistamines","Vitamin C"]
    },
    "diabetes": {
        "symptoms": ["frequent urination","excessive thirst","weight loss","blurred vision",
                     "fatigue","slow healing","sugar","pyaas","mutra",
                     # Hindi
                     "zyada pyaas","baar baar peshab","madhumeh","sugar rog","aankhein dhundhi",
                     "मधुमेह","शुगर","प्यास","पेशाब","वजन","मोटापा","थकान",
                     # Kannada romanized
                     "sigambu rog","sigambu","neerupippu","drishti","thoogramishta",
                     "ಮಧುಮೇಹ","ಸಕ್ಕರೆ ಕಾಯಿಲೆ","ತೃಷ್ಣೆ","ಮೂತ್ರ","ದೃಷ್ಟಿ"],
        "advice": {
            "en": "Monitor blood sugar regularly. Follow diet plan, exercise daily. Never skip medication.",
            "hi": "रक्त शर्करा नियमित जांचें। आहार योजना का पालन करें। दवा न छोड़ें।",
            "kn": "ನಿಯಮಿತ ರಕ್ತ ಸಕ್ಕರೆ ಪರೀಕ್ಷಿಸಿ. ಆಹಾರ ಯೋಜನೆ ಅನುಸರಿಸಿ."
        },
        "severity":"high","icon":"🩸","color":"#FDCB6E","precautions":
        ["Low sugar diet","Daily exercise","Regular HbA1c testing"],
        "common_meds":["Metformin","Insulin (doctor prescribed)","Glipizide"]
    },
    "hypertension": {
        "symptoms": ["headache","dizziness","chest pain","shortness of breath",
                     "blurred vision","nosebleed","bp","blood pressure","rakta chap"],
        "advice": {
            "en": "Reduce salt. Avoid stress. Monitor BP daily. Take prescribed medications.",
            "hi": "नमक कम करें। तनाव से बचें। BP रोज जांचें। दवाएं नियमित लें।",
            "kn": "ಉಪ್ಪು ಕಡಿಮೆ ಮಾಡಿ. ಒತ್ತಡ ತಪ್ಪಿಸಿ. BP ಪ್ರತಿದಿನ ಪರೀಕ್ಷಿಸಿ."
        },
        "severity":"high","icon":"💓","color":"#E17055","precautions":
        ["DASH diet","Reduce alcohol","30 min aerobic exercise daily"],
        "common_meds":["Amlodipine","Losartan","Hydrochlorothiazide"]
    },
    "allergy": {
        "symptoms": ["itching","rash","hives","sneezing","watery eyes","swelling",
                     "khujli","daane","twacha"],
        "advice": {
            "en": "Avoid allergens. Antihistamines help. Emergency care for breathing difficulty.",
            "hi": "एलर्जी के कारणों से दूर रहें। सांस में दिक्कत हो तो तुरंत डॉक्टर।",
            "kn": "ಅಲರ್ಜಿ ಕಾರಕ ದ್ರವ್ಯದಿಂದ ದೂರ ಇರಿ."
        },
        "severity":"medium","icon":"🌺","color":"#A29BFE","precautions":
        ["Identify triggers","Keep epinephrine auto-injector handy","Wear medical alert bracelet"],
        "common_meds":["Cetirizine","Loratadine","Fexofenadine"]
    },
    "acne": {
        "symptoms": ["pimples","blackheads","whiteheads","oily skin","skin breakout",
                     "face","muhase","daag"],
        "advice": {
            "en": "Wash face twice daily. Avoid touching. Use non-comedogenic products.",
            "hi": "दिन में दो बार चेहरा धोएं। त्वचा विशेषज्ञ से मिलें।",
            "kn": "ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಮುಖ ತೊಳೆಯಿರಿ."
        },
        "severity":"low","icon":"✨","color":"#FD79A8","precautions":
        ["Stay hydrated","Avoid oily foods","Change pillow covers weekly"],
        "common_meds":["Benzoyl Peroxide","Salicylic Acid","Tretinoin (prescribed)"]
    },
    "typhoid": {
        "symptoms": ["high fever","stomach pain","diarrhea","constipation","weakness",
                     "rash","pet dard","tez bukhar"],
        "advice": {
            "en": "See doctor immediately. Eat light food, avoid raw vegetables. Complete antibiotic course.",
            "hi": "तुरंत डॉक्टर से मिलें। एंटीबायोटिक कोर्स पूरा करें।",
            "kn": "ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಕಾಣಿ. ಆಂಟಿಬಯಾಟಿಕ್ ಕೋರ್ಸ್ ಮುಗಿಸಿ."
        },
        "severity":"high","icon":"🌡️","color":"#FF7675","precautions":
        ["Drink only boiled/filtered water","Eat freshly cooked food","Get vaccinated"],
        "common_meds":["Azithromycin","Ciprofloxacin (doctor prescribed)"]
    },
    "covid": {
        "symptoms": ["fever","dry cough","tiredness","loss of taste","loss of smell",
                     "breathing difficulty","corona","covid"],
        "advice": {
            "en": "Isolate immediately. Get tested. Monitor SpO2. Emergency care if SpO2 < 94%.",
            "hi": "तुरंत अलग हों। परीक्षण करवाएं। SpO2 < 94% हो तो अस्पताल जाएं।",
            "kn": "ತಕ್ಷಣ ಪ್ರತ್ಯೇಕ. ಪರೀಕ್ಷೆ ಮಾಡಿ. SpO2 < 94% ಆದರೆ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ."
        },
        "severity":"high","icon":"😷","color":"#E17055","precautions":
        ["Wear N95 mask","Isolate for 7–10 days","Monitor oxygen with pulse oximeter"],
        "common_meds":["Paracetamol (fever)","Dexamethasone (severe, prescribed)"]
    },
    "dengue": {
        "symptoms": ["sudden fever","severe headache","pain behind eyes","joint pain",
                     "rash","bleeding","dengue","machhar"],
        "advice": {
            "en": "No aspirin/ibuprofen. Increase fluids. Monitor platelet count. Hospitalize if platelets < 1 lakh.",
            "hi": "एस्पिरिन न लें। प्लेटलेट काउंट निगरानी करें।",
            "kn": "ಆಸ್ಪಿರಿನ್ ತೆಗೆಯಬೇಡಿ. ಪ್ಲೇಟ್‌ಲೆಟ್ ಮಟ್ಟ ಗಮನಿಸಿ."
        },
        "severity":"high","icon":"🦟","color":"#FF6B6B","precautions":
        ["Use mosquito repellent","Wear full-sleeved clothes","Drain standing water"],
        "common_meds":["Paracetamol (only)","IV Fluids (hospital)"]
    },
    "anemia": {
        "symptoms": ["fatigue","weakness","pale skin","shortness of breath","dizziness",
                     "cold hands","khoon","hemoglobin",
                     # Hindi romanized
                     "thakaan","kamzori","pale","chakkar","khoon ki kami","saans","laal",
                     # Hindi script triggers (transliterated in text)
                     "रक्त","हीमोग्लोबिन","कमज़ोरी","थकान",
                     # Kannada romanized
                     "aayasa","durbalatva","tala suttuvudu","raktaheenatve","hemoglobin",
                     "ಥಕ","ದೌರ್ಬಲ್ಯ","ರಕ್ತ"],
        "advice": {
            "en": "Eat iron-rich foods. Vitamin C aids absorption. Get CBC blood test.",
            "hi": "आयरन युक्त खाना खाएं। विटामिन C लें। रक्त जांच करवाएं।",
            "kn": "ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರ ತಿನ್ನಿ. ವಿಟಮಿನ್ C ತೆಗೆಕೊಳ್ಳಿ. CBC ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿ."
        },
        "severity":"medium","icon":"🩺","color":"#74B9FF","precautions":
        ["Eat spinach, lentils, red meat","Cook in iron vessel","Avoid tea/coffee with meals"],
        "common_meds":["Ferrous Sulphate","Folic Acid","Vitamin B12"]
    },

    # ── NEW DISEASES ─────────────────────────────────────────────────────────

    "asthma": {
        "symptoms": ["wheezing","breathlessness","chest tightness","cough at night",
                     "shortness of breath","inhaler","saans","sans","dam","breathe",
                     # Hindi
                     "dam phoolna","saans nahi aana","saans ki takleef","khankhi",
                     "दमा","श्वास","सांस","खांसी",
                     # Kannada romanized
                     "ushira biduvudu","omphal novu","khansi","svaasa","kaslu",
                     "ಉಸಿರಾಟ","ದಮ್ಮು","ಕೆಮ್ಮು"],
        "advice": {
            "en": "Use prescribed inhaler. Avoid triggers (dust, smoke, pollen). See pulmonologist for long-term management.",
            "hi": "डॉक्टर द्वारा दिया इन्हेलर उपयोग करें। धूल, धुएं से बचें। श्वास विशेषज्ञ से मिलें।",
            "kn": "ವೈದ್ಯರು ಶಿಫಾರಸು ಮಾಡಿದ ಇನ್ಹೇಲರ್ ಉಪಯೋಗಿಸಿ. ಧೂಳು, ಹೊಗೆಯಿಂದ ದೂರ ಇರಿ. ಶ್ವಾಸಕೋಶ ತಜ್ಞರನ್ನು ಕಾಣಿ."
        },
        "severity":"high","icon":"🫁","color":"#00CEC9","precautions":
        ["Carry rescue inhaler always","Avoid cold air & exercise triggers","Use air purifier at home","Monitor peak flow daily"],
        "common_meds":["Salbutamol inhaler","Budesonide (preventive)","Montelukast","Ipratropium"]
    },

    "tuberculosis": {
        "symptoms": ["persistent cough","cough with blood","night sweats","weight loss",
                     "fever","fatigue","chest pain","tb","khaansi","raat ko pasina",
                     # Hindi
                     "khansi mein khoon","tpedik","raat pasina","bukhar","TB",
                     "क्षय","तपेदिक","खांसी","रात","खून",
                     # Kannada romanized
                     "raatri bejaru","khansi","yakshmava","elusuvudu","tpedik",
                     "ಕ್ಷಯ","ಕೆಮ್ಮು","ರಕ್ತ","ರಾತ್ರಿ ಬೆವರು"],
        "advice": {
            "en": "See a doctor immediately for sputum test. Complete the full 6-month DOTS course. TB is curable!",
            "hi": "तुरंत डॉक्टर से मिलें। थूक परीक्षण करवाएं। 6 महीने की पूरी DOTS दवा लें। TB ठीक होता है!",
            "kn": "ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಕಾಣಿ. ಕಫ ಪರೀಕ್ಷೆ ಮಾಡಿ. 6 ತಿಂಗಳ DOTS ಔಷಧ ಪೂರ್ತಿ ತೆಗೆಕೊಳ್ಳಿ. TB ಗುಣವಾಗಬಲ್ಲದು!"
        },
        "severity":"high","icon":"🫀","color":"#D63031","precautions":
        ["Wear mask to prevent spreading","Cover mouth while coughing","Ventilate living space","Complete full antibiotic course"],
        "common_meds":["Isoniazid","Rifampicin","Pyrazinamide","Ethambutol (DOTS regimen)"]
    },

    "gastritis": {
        "symptoms": ["stomach ache","stomach pain","acidity","burning stomach","indigestion",
                     "nausea","vomiting","bloating","pet dard","acidity","jalan",
                     # Hindi
                     "pait mein jalan","buk dard","ulti","khana nahi pachna","gas",
                     "पेट दर्द","जलन","अम्लता","गैस","उल्टी",
                     # Kannada romanized
                     "hotti novu","hotti uri","oggarane","kashta","udharamyasiya",
                     "ಹೊಟ್ಟೆ ನೋವು","ಉರಿ","ವಾಂತಿ","ಅಜೀರ್ಣ","ಹೊಟ್ಟೆ ಉರಿ"],
        "advice": {
            "en": "Avoid spicy, oily food. Eat small frequent meals. Avoid alcohol, caffeine. See doctor for H. pylori test.",
            "hi": "मसालेदार और तैलीय खाना बंद करें। थोड़ा-थोड़ा बार-बार खाएं। शराब और चाय कम करें।",
            "kn": "ಮಸಾಲೆ ಮತ್ತು ತೈಲಮಯ ಆಹಾರ ತಪ್ಪಿಸಿ. ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಆಗಿಂದ ತಿನ್ನಿ. ಮದ್ಯ, ಕಾಫಿ ಕಡಿಮೆ ಮಾಡಿ."
        },
        "severity":"medium","icon":"🤢","color":"#FDCB6E","precautions":
        ["Avoid NSAIDs (ibuprofen)","Eat on time","Reduce stress","Avoid lying down right after eating"],
        "common_meds":["Pantoprazole","Omeprazole","Antacids (Gelusil)","Domperidone"]
    },

    "arthritis": {
        "symptoms": ["joint pain","swelling joints","stiff joints","knee pain","morning stiffness",
                     "ghutna dard","jod dard","soojan",
                     # Hindi
                     "jodo mein dard","ghutnon mein dard","subah akadna","hath pair dard",
                     "जोड़ दर्द","सूजन","घुटना","गठिया","अकड़न",
                     # Kannada romanized
                     "kandha novu","manikaTTu novu","gaLayinda novu","maLe",
                     "ಕೀಲು ನೋವು","ಮೊಣಕಾಲು ನೋವು","ಊತ","ಬೆಳಿಗ್ಗೆ ಗಟ್ಟಿ"],
        "advice": {
            "en": "Exercise regularly (low impact). Apply hot/cold packs. See rheumatologist for RA. Maintain healthy weight.",
            "hi": "नियमित हल्का व्यायाम करें। गर्म/ठंडी सिकाई करें। संधिवात विशेषज्ञ से मिलें।",
            "kn": "ನಿಯಮಿತ ಹಗುರ ವ್ಯಾಯಾಮ ಮಾಡಿ. ಬಿಸಿ/ತಣ್ಣನೆ ಶಾಖ ಪ್ಯಾಕ್ ಹಾಕಿ. ಸಂಧಿವಾತ ತಜ್ಞರನ್ನು ಕಾಣಿ."
        },
        "severity":"medium","icon":"🦴","color":"#A29BFE","precautions":
        ["Maintain healthy weight","Do yoga or swimming","Avoid repetitive stress on joints","Take omega-3 rich diet"],
        "common_meds":["Ibuprofen","Naproxen","Methotrexate (RA, prescribed)","Hydroxychloroquine"]
    },

    "migraine": {
        "symptoms": ["severe headache","throbbing head","nausea with headache","light sensitivity",
                     "sound sensitivity","aura","one sided headache","sar dard","sir dard",
                     # Hindi
                     "tez sar dard","adha sir dard","chakkar aur dard","aankhon mein dard",
                     "सिरदर्द","आधाशीशी","माइग्रेन","मिचली",
                     # Kannada romanized
                     "tala novu","ardhashirashula","belaku sensitiviti","tala vedane",
                     "ತಲೆ ನೋವು","ಮೈಗ್ರೇನ್","ವಾಕರಿಕೆ","ಬೆಳಕು ಸಂವೇದನೆ"],
        "advice": {
            "en": "Rest in a dark quiet room. Apply ice pack. Stay hydrated. See neurologist for recurring migraines.",
            "hi": "अंधेरे और शांत कमरे में आराम करें। बर्फ लगाएं। पानी पिएं। बार-बार होने पर न्यूरोलॉजिस्ट से मिलें।",
            "kn": "ಕತ್ತಲೆ, ಶಾಂತ ಕೋಣೆಯಲ್ಲಿ ವಿಶ್ರಮಿಸಿ. ಐಸ್ ಪ್ಯಾಕ್ ಹಾಕಿ. ನೀರು ಕುಡಿಯಿರಿ. ನ್ಯೂರಾಲಜಿಸ್ಟ್ ಕಾಣಿ."
        },
        "severity":"medium","icon":"🤕","color":"#6C5CE7","precautions":
        ["Identify and avoid triggers (stress, caffeine, certain foods)","Maintain sleep schedule","Limit screen time","Keep a migraine diary"],
        "common_meds":["Sumatriptan","Paracetamol","Ibuprofen","Propranolol (preventive, prescribed)"]
    },

    "urinary tract infection": {
        "symptoms": ["burning urination","frequent urination","cloudy urine","pelvic pain",
                     "blood in urine","uti","peshaab mein jalan",
                     # Hindi
                     "mutrane mein jalan","baar baar peshaab","pet ke neeche dard",
                     "पेशाब में जलन","बार-बार पेशाब","UTI","मूत्र संक्रमण",
                     # Kannada romanized
                     "mootra uri","baar baar mootra","mootra novu","mootra rogha",
                     "ಮೂತ್ರ ಉರಿ","ಮೂತ್ರ ಸೋಂಕು","ಹೊಟ್ಟೆ ನೋವು","ಮೇಡಿಕಲ್"],
        "advice": {
            "en": "Drink plenty of water. Urinate after intercourse. See doctor for urine culture & antibiotic course.",
            "hi": "खूब पानी पिएं। यूरिन कल्चर टेस्ट करवाएं। डॉक्टर से एंटीबायोटिक लें।",
            "kn": "ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ. ಮೂತ್ರ ಕಲ್ಚರ್ ಪರೀಕ್ಷೆ ಮಾಡಿ. ವೈದ್ಯರಿಂದ ಆಂಟಿಬಯಾಟಿಕ್ ಪಡೆಯಿರಿ."
        },
        "severity":"medium","icon":"🔱","color":"#FDCB6E","precautions":
        ["Drink 8+ glasses of water daily","Don't hold urine","Wipe front to back (women)","Avoid irritating soaps"],
        "common_meds":["Nitrofurantoin","Trimethoprim","Fosfomycin","Cranberry supplements"]
    },

    "chickenpox": {
        "symptoms": ["itchy rash","blisters","red spots","fever","fatigue","scabs",
                     "varicella","chechak","chhoti maa",
                     # Hindi
                     "khujli wale daane","choti maa","jhul phuli","chiknpox",
                     "छोटी माता","चेचक","खुजली","दाने","फफोले",
                     # Kannada romanized
                     "soubhagya","gulikaadaru","kalagacha","kudupina kaayilu",
                     "ಸಿಡುಬು","ತಿತ್ತಿ","ಕಜ್ಜಿ","ಗುಳ್ಳೆ","ಜ್ವರ"],
        "advice": {
            "en": "Isolate to avoid spreading. Use calamine lotion for itching. Trim nails. See doctor for antiviral if severe.",
            "hi": "अलग रहें। खुजली के लिए कैलामाइन लोशन लगाएं। नाखून काटें। गंभीर हो तो डॉक्टर से मिलें।",
            "kn": "ಪ್ರತ್ಯೇಕ ಇರಿ. ಕಜ್ಜಿಗೆ ಕ್ಯಾಲಮೈನ್ ಲೋಶನ್ ಹಾಕಿ. ಉಗುರು ಕತ್ತರಿಸಿ. ತೀವ್ರವಾದರೆ ವೈದ್ಯರನ್ನು ಕಾಣಿ."
        },
        "severity":"medium","icon":"🌟","color":"#FD79A8","precautions":
        ["Avoid scratching blisters","Do not give aspirin to children","Isolate for 7 days","Get varicella vaccine (preventive)"],
        "common_meds":["Acyclovir (antiviral, doctor prescribed)","Calamine lotion","Paracetamol","Antihistamines"]
    },

    "thyroid": {
        "symptoms": ["weight gain","weight loss","fatigue","cold sensitivity","heat sensitivity",
                     "hair loss","depression","rapid heartbeat","thyroid","tsh",
                     # Hindi
                     "vajan badhna","bal girna","thakaan","thand lagna","zyada garam lagna",
                     "थायराइड","वज़न","थकान","बाल झड़ना","ठंड",
                     # Kannada romanized
                     "thoogramishta","thayraid","ookuvidu","thaLira","kothi",
                     "ಥೈರಾಯ್ಡ್","ತೂಕ","ಕೂದಲು ಉದುರುವಿಕೆ","ಆಯಾಸ","ಚಳಿ"],
        "advice": {
            "en": "Get TSH blood test. Take medication at the same time daily. Never skip doses.",
            "hi": "TSH रक्त परीक्षण करवाएं। प्रतिदिन एक ही समय पर दवा लें। दवा कभी न छोड़ें।",
            "kn": "TSH ರಕ್ತ ಪರೀಕ್ಷೆ ಮಾಡಿ. ಪ್ರತಿದಿನ ಒಂದೇ ಸಮಯಕ್ಕೆ ಔಷಧ ತೆಗೆಕೊಳ್ಳಿ. ಔಷಧ ಬಿಡಬೇಡಿ."
        },
        "severity":"medium","icon":"🦋","color":"#00B894","precautions":
        ["Take medication on empty stomach","Avoid soy and excessive iodine","Regular TSH checks every 6 months","Manage stress"],
        "common_meds":["Levothyroxine (hypothyroid)","Carbimazole (hyperthyroid, prescribed)","Selenium supplements"]
    },

    "jaundice": {
        "symptoms": ["yellow skin","yellow eyes","dark urine","pale stool","fatigue","nausea",
                     "pilia","piliya","liver",
                     # Hindi
                     "aankhein peeli","chamda peela","piliya","gehra peshaab",
                     "पीलिया","पीला","आँखें","जिगर","यकृत",
                     # Kannada romanized
                     "kamala roga","haladi bhashyam","mootra","kannugal haladiyu",
                     "ಕಾಮಾಲೆ","ಹಳದಿ","ಕಣ್ಣು","ಮೂತ್ರ","ಯಕೃತ್"],
        "advice": {
            "en": "Rest completely. Eat light diet (khichdi, fruits). Drink plenty of water. See doctor for liver function test immediately.",
            "hi": "पूरा आराम करें। हल्का खाना खाएं (खिचड़ी, फल)। खूब पानी पिएं। तुरंत LFT टेस्ट करवाएं।",
            "kn": "ಸಂಪೂರ್ಣ ವಿಶ್ರಾಂತಿ ತೆಗೆಕೊಳ್ಳಿ. ಹಗುರ ಆಹಾರ ತಿನ್ನಿ. ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ. LFT ಪರೀಕ್ಷೆ ತಕ್ಷಣ ಮಾಡಿ."
        },
        "severity":"high","icon":"🟡","color":"#FDCB6E","precautions":
        ["Avoid alcohol completely","Avoid fatty, fried food","Drink only clean water","Complete bed rest"],
        "common_meds":["Ursodeoxycholic acid (doctor prescribed)","Silymarin (liver supplement)","IV Fluids if severe"]
    },

    "food poisoning": {
        "symptoms": ["vomiting","diarrhea","stomach cramps","nausea","fever","food poisoning",
                     "khana kharab","ulti","dast",
                     # Hindi
                     "khana khake bura laga","ulti dast","pet mein maror","kharab khana",
                     "उल्टी","दस्त","पेट दर्द","जी मिचलाना","खाना",
                     # Kannada romanized
                     "vanti","moola vyaadhi","hotti novu","bhojana vishavaayu",
                     "ವಾಂತಿ","ಭೇದಿ","ಹೊಟ್ಟೆ ನೋವು","ಊಟ ವಿಷ"],
        "advice": {
            "en": "Take ORS for hydration. Rest. Eat bland food (rice, banana). See doctor if vomiting/diarrhea persists > 24 hrs.",
            "hi": "ORS पिएं। आराम करें। हल्का खाना खाएं (चावल, केला)। 24 घंटे से ज्यादा हो तो डॉक्टर से मिलें।",
            "kn": "ORS ಕುಡಿಯಿರಿ. ವಿಶ್ರಾಂತಿ ತೆಗೆಕೊಳ್ಳಿ. ಹಗುರ ಆಹಾರ ತಿನ್ನಿ. 24 ಗಂಟೆಗಿಂತ ಹೆಚ್ಚಾದರೆ ವೈದ್ಯರನ್ನು ಕಾಣಿ."
        },
        "severity":"medium","icon":"🤮","color":"#55EFC4","precautions":
        ["Drink ORS/electrolytes","Avoid dairy until recovered","Wash hands before eating","Cook food thoroughly"],
        "common_meds":["ORS sachets","Domperidone (anti-nausea)","Loperamide (diarrhea)","Ondansetron"]
    }
}

EMERGENCY_KEYWORDS = [
    "chest pain","heart attack","stroke","unconscious","not breathing",
    "severe bleeding","seizure","overdose","suicide","emergency",
    "dil dard","behosh","sans nahi","tez dard"
]

GREETING_TRIGGERS = ['hello','hi','hey','namaste','namaskar','namaskara','vanakkam']

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 4 — UTILITY / BUSINESS LOGIC
# ══════════════════════════════════════════════════════════════════════════════

def detect_language(text: str) -> str:
    if len(re.findall(r'[\u0C80-\u0CFF]', text)) > 0: return "kn"
    if len(re.findall(r'[\u0900-\u097F]', text)) > 0: return "hi"
    hi_kw = [
        "bukhar","dard","khasi","naak","pet","sar","thakaan","pyaas","mutra","behosh","khoon",
        "zukam","jukham","sardi","khansi","ulti","dast","jalan","soojan","chakkar","kamzori",
        "neend","sans","dam","piliya","sujan","rog","bimari","dawai","doctor","ilaj",
        "malariya","typhoid","dengue","sukha","motapa","peeda","thand","khujli","daane"
    ]
    kn_kw = [
        "tapamana","novu","khansi","moogu","hoti","tala",
        "jwara","kaslu","ushira","hotti","taladupu","aayasa","durbalatva",
        "mootra","rakta","vomit","hotti novu","kasale","neeru","matu",
        "rogha","aushadha","vaidya","sharira","nakkali","bada","kaayile"
    ]
    tl = text.lower()
    if any(w in tl for w in hi_kw): return "hi"
    if any(w in tl for w in kn_kw): return "kn"
    return "en"

def analyze_symptoms(text: str) -> list:
    tl = text.lower()
    matches = []
    for disease, data in DISEASE_DB.items():
        score = sum(1 for s in data["symptoms"] if s in tl)
        if score > 0:
            matches.append({"disease": disease, "score": score, "data": data})
    return sorted(matches, key=lambda x: x["score"], reverse=True)[:3]

def check_emergency(text: str) -> bool:
    return any(kw in text.lower() for kw in EMERGENCY_KEYWORDS)

def bmi_category(bmi: float, lang: str) -> tuple:
    if bmi < 18.5:
        cats = {"en":"Underweight","hi":"कम वजन","kn":"ಕಡಿಮೆ ತೂಕ"}
        return cats.get(lang, cats["en"]), "#74B9FF"
    elif bmi < 25:
        cats = {"en":"Normal weight ✓","hi":"सामान्य वजन ✓","kn":"ಸಾಮಾನ್ಯ ತೂಕ ✓"}
        return cats.get(lang, cats["en"]), "#00B894"
    elif bmi < 30:
        cats = {"en":"Overweight","hi":"अधिक वजन","kn":"ಹೆಚ್ಚು ತೂಕ"}
        return cats.get(lang, cats["en"]), "#FDCB6E"
    else:
        cats = {"en":"Obese","hi":"मोटापा","kn":"ಸ್ಥೂಲಕಾಯ"}
        return cats.get(lang, cats["en"]), "#E17055"

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 5 — AUTH ROUTES  /api/auth/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    """POST /api/auth/register — Create new user account"""
    d = request.get_json()
    username = d.get('username','').strip()
    email    = d.get('email','').strip()
    password = d.get('password','')
    if not username or not email or not password:
        return jsonify({"error":"All fields required"}), 400
    if len(password) < 6:
        return jsonify({"error":"Password must be at least 6 characters"}), 400
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (username,email,password) VALUES (?,?,?)",
                     (username, email, hash_password(password)))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        token = make_token(user['id'], user['username'])
        return jsonify({"token": token, "user": {"id": user['id'],
                        "username": user['username'], "email": user['email']}}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error":"Username or email already exists"}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """POST /api/auth/login — Login and receive JWT token"""
    d = request.get_json()
    username = d.get('username','').strip()
    password = d.get('password','')
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=? AND password=?",
                        (username, hash_password(password))).fetchone()
    conn.close()
    if not user:
        return jsonify({"error":"Invalid credentials"}), 401
    token = make_token(user['id'], user['username'])
    return jsonify({"token": token, "user": {"id": user['id'],
                    "username": user['username'], "email": user['email']}})

@app.route('/api/auth/me', methods=['GET'])
@token_required
def me():
    """GET /api/auth/me — Get current user profile"""
    conn = get_db()
    user = conn.execute("SELECT id,username,email,created_at FROM users WHERE id=?",
                        (request.user['user_id'],)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error":"User not found"}), 404
    return jsonify(dict(user))

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 6 — CHAT REST API  /api/chat/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/chat', methods=['POST'])
@token_required
def chat():
    """POST /api/chat — Symptom analysis (auth required, saves history)"""
    d    = request.get_json()
    text = d.get('message','').strip()
    lang = d.get('lang','') or detect_language(text)
    uid  = request.user['user_id']

    # Save user message
    conn = get_db()
    conn.execute("INSERT INTO chat_history (user_id,role,message,lang) VALUES (?,?,?,?)",
                 (uid, 'user', text, lang))
    conn.commit()

    # Build response
    if any(g in text.lower() for g in GREETING_TRIGGERS):
        resp = {
            "type":"greeting",
            "message": {
                "en": "Hello! I'm MediBot 🏥 — your AI health assistant. Describe your symptoms.",
                "hi": "नमस्ते! मैं MediBot हूं 🏥। अपने लक्षण बताएं।",
                "kn": "ನಮಸ್ಕಾರ! ನಾನು MediBot 🏥. ನಿಮ್ಮ ರೋಗಲಕ್ಷಣ ಹೇಳಿ."
            }.get(lang, "Hello! I'm MediBot 🏥"),
            "lang": lang
        }
    elif check_emergency(text):
        resp = {
            "type":"emergency",
            "message": {
                "en":"🚨 EMERGENCY! Call 112 or 108 IMMEDIATELY!",
                "hi":"🚨 आपातकाल! तुरंत 112 या 108 पर कॉल करें!",
                "kn":"🚨 ತುರ್ತು! ತಕ್ಷಣ 112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡಿ!"
            }.get(lang, "🚨 EMERGENCY! Call 112 NOW!"),
            "lang": lang
        }
    else:
        matches = analyze_symptoms(text)
        if not matches:
            resp = {
                "type":"clarify",
                "message": {
                    "en":"Couldn't identify symptoms. Please describe clearly. E.g. 'I have fever and headache for 2 days'.",
                    "hi":"लक्षण पहचान नहीं पाया। स्पष्ट रूप से बताएं।",
                    "kn":"ರೋಗಲಕ್ಷಣ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸಿ."
                }.get(lang, "Please describe symptoms clearly."),
                "lang": lang
            }
        else:
            top = matches[0]
            advice = top['data']['advice'].get(lang, top['data']['advice']['en'])
            sev = top['data']['severity']

            # Doctor contact advice based on severity
            doctor_advice = None
            if sev == 'high':
                doctor_advice = {
                    "en": "🏥 Please consult a doctor immediately. This condition requires urgent medical attention.",
                    "hi": "🏥 कृपया तुरंत डॉक्टर से मिलें। यह स्थिति तत्काल चिकित्सा ध्यान की मांग करती है।",
                    "kn": "🏥 ದಯವಿಟ್ಟು ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಕಾಣಿ. ಈ ಸ್ಥಿತಿಗೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಗಮನ ಅಗತ್ಯ."
                }.get(lang, "🏥 Please consult a doctor immediately.")
            elif sev == 'medium':
                doctor_advice = {
                    "en": "👨‍⚕️ Recommended to visit a doctor soon if symptoms persist for more than 2 days.",
                    "hi": "👨‍⚕️ यदि लक्षण 2 दिनों से अधिक रहें तो जल्द डॉक्टर से मिलें।",
                    "kn": "👨‍⚕️ ರೋಗಲಕ್ಷಣ 2 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ ಶೀಘ್ರವಾಗಿ ವೈದ್ಯರನ್ನು ಕಾಣಿ."
                }.get(lang, "👨‍⚕️ See a doctor if symptoms persist more than 2 days.")

            resp = {
                "type":"diagnosis",
                "message": advice,
                "top_disease": top['disease'],
                "severity": sev,
                "icon": top['data']['icon'],
                "color": top['data']['color'],
                "precautions": top['data']['precautions'],
                "common_meds": top['data']['common_meds'],
                "doctor_advice": doctor_advice,
                "matches": [{"disease":m['disease'],"score":m['score'],
                             "severity":m['data']['severity'],"icon":m['data']['icon'],
                             "color":m['data']['color']} for m in matches],
                "lang": lang
            }

    # Save bot response
    conn.execute("INSERT INTO chat_history (user_id,role,message,lang) VALUES (?,?,?,?)",
                 (uid, 'bot', resp.get('message',''), lang))
    conn.commit()
    conn.close()
    return jsonify(resp)

@app.route('/api/chat/history', methods=['GET'])
@token_required
def chat_history():
    """GET /api/chat/history — Retrieve user's chat history"""
    uid  = request.user['user_id']
    limit = int(request.args.get('limit', 50))
    conn = get_db()
    rows = conn.execute(
        "SELECT role,message,lang,created_at FROM chat_history WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (uid, limit)).fetchall()
    conn.close()
    return jsonify({"history": [dict(r) for r in reversed(rows)]})

@app.route('/api/chat/history', methods=['DELETE'])
@token_required
def clear_chat_history():
    """DELETE /api/chat/history — Clear user's chat history"""
    uid = request.user['user_id']
    conn = get_db()
    conn.execute("DELETE FROM chat_history WHERE user_id=?", (uid,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Chat history cleared"})

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 7 — TABLET REMINDERS  /api/tablets/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/tablets', methods=['GET'])
@token_required
def get_tablets():
    """GET /api/tablets — Get all tablets for today"""
    uid  = request.user['user_id']
    today = datetime.date.today().isoformat()
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM tablets WHERE user_id=? AND date=?", (uid, today)).fetchall()
    conn.close()
    return jsonify({"tablets": [dict(r) for r in rows]})

@app.route('/api/tablets', methods=['POST'])
@token_required
def add_tablet():
    """POST /api/tablets — Add a new tablet reminder"""
    uid = request.user['user_id']
    d   = request.get_json()
    name = d.get('name','').strip()
    time = d.get('time','')
    if not name:
        return jsonify({"error":"Tablet name required"}), 400
    today = datetime.date.today().isoformat()
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO tablets (user_id,name,time,date) VALUES (?,?,?,?)",
        (uid, name, time, today))
    conn.commit()
    row = conn.execute("SELECT * FROM tablets WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/tablets/<int:tablet_id>', methods=['PATCH'])
@token_required
def update_tablet(tablet_id):
    """PATCH /api/tablets/:id — Toggle taken status"""
    uid = request.user['user_id']
    d   = request.get_json()
    taken = 1 if d.get('taken') else 0
    conn = get_db()
    conn.execute(
        "UPDATE tablets SET taken=? WHERE id=? AND user_id=?",
        (taken, tablet_id, uid))
    conn.commit()
    row = conn.execute("SELECT * FROM tablets WHERE id=?", (tablet_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/tablets/<int:tablet_id>', methods=['DELETE'])
@token_required
def delete_tablet(tablet_id):
    """DELETE /api/tablets/:id — Delete a tablet"""
    uid = request.user['user_id']
    conn = get_db()
    conn.execute("DELETE FROM tablets WHERE id=? AND user_id=?", (tablet_id, uid))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"})

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 8 — WATER INTAKE  /api/water/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/water', methods=['GET'])
@token_required
def get_water():
    """GET /api/water — Get today's water intake"""
    uid   = request.user['user_id']
    today = datetime.date.today().isoformat()
    conn  = get_db()
    row   = conn.execute(
        "SELECT * FROM water_intake WHERE user_id=? AND date=?", (uid, today)).fetchone()
    conn.close()
    return jsonify({"glasses": row['glasses'] if row else 0, "date": today, "goal": 8})

@app.route('/api/water', methods=['PUT'])
@token_required
def update_water():
    """PUT /api/water — Set water glass count for today"""
    uid     = request.user['user_id']
    d       = request.get_json()
    glasses = int(d.get('glasses', 0))
    today   = datetime.date.today().isoformat()
    conn    = get_db()
    conn.execute(
        "INSERT INTO water_intake (user_id,glasses,date) VALUES (?,?,?) "
        "ON CONFLICT(user_id,date) DO UPDATE SET glasses=?",
        (uid, glasses, today, glasses))
    conn.commit()
    conn.close()
    return jsonify({"glasses": glasses, "date": today, "goal": 8,
                    "achieved": glasses >= 8})

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 9 — BMI  /api/bmi/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/bmi', methods=['POST'])
@token_required
def calculate_bmi():
    """POST /api/bmi — Calculate BMI and save to history"""
    uid  = request.user['user_id']
    d    = request.get_json()
    try:
        weight = float(d['weight'])
        height = float(d['height']) / 100
        lang   = d.get('lang', 'en')
    except (KeyError, ValueError, TypeError):
        return jsonify({"error":"Invalid weight/height"}), 400
    bmi = round(weight / (height * height), 1)
    category, color = bmi_category(bmi, lang)
    conn = get_db()
    conn.execute(
        "INSERT INTO bmi_log (user_id,weight,height,bmi,category) VALUES (?,?,?,?,?)",
        (uid, weight, float(d['height']), bmi, category))
    conn.commit()
    conn.close()
    return jsonify({"bmi": bmi, "category": category, "color": color,
                    "weight": weight, "height": float(d['height'])})

@app.route('/api/bmi/history', methods=['GET'])
@token_required
def bmi_history():
    """GET /api/bmi/history — Get BMI history"""
    uid = request.user['user_id']
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM bmi_log WHERE user_id=? ORDER BY recorded_at DESC LIMIT 20",
        (uid,)).fetchall()
    conn.close()
    return jsonify({"history": [dict(r) for r in rows]})

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 10 — VITALS  /api/vitals/*
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/vitals', methods=['GET'])
@token_required
def get_vitals():
    """GET /api/vitals — Get latest vitals for user"""
    uid = request.user['user_id']
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM vitals WHERE user_id=? ORDER BY recorded_at DESC LIMIT 1",
        (uid,)).fetchone()
    history = conn.execute(
        "SELECT * FROM vitals WHERE user_id=? ORDER BY recorded_at DESC LIMIT 10",
        (uid,)).fetchall()
    conn.close()
    return jsonify({
        "latest": dict(row) if row else None,
        "history": [dict(r) for r in history]
    })

@app.route('/api/vitals', methods=['POST'])
@token_required
def log_vitals():
    """POST /api/vitals — Log new vitals entry"""
    uid = request.user['user_id']
    d   = request.get_json()
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO vitals (user_id,temperature,heart_rate,bp_systolic,bp_diastolic,spo2,blood_sugar) VALUES (?,?,?,?,?,?,?)",
        (uid, d.get('temperature'), d.get('heart_rate'), d.get('bp_systolic'),
         d.get('bp_diastolic'), d.get('spo2'), d.get('blood_sugar')))
    conn.commit()
    row = conn.execute("SELECT * FROM vitals WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 11 — IMAGE ANALYSIS  /api/analyze-image
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/analyze-image', methods=['POST'])
@token_required
def analyze_image():
    """POST /api/analyze-image — Skin/injury image analysis (OpenCV)"""
    if 'image' not in request.files:
        return jsonify({'error':'No image provided'}), 400
    file = request.files['image']
    lang = request.form.get('lang','en')
    filename = f"{uuid.uuid4().hex}.jpg"
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)
    try:
        import cv2, numpy as np
        img = cv2.imread(path)
        if img is None: raise ValueError("Unreadable")
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = float(hsv[:,:,0].mean()), float(hsv[:,:,1].mean()), float(hsv[:,:,2].mean())
        if s > 80 and 0 <= h <= 20:
            condition, severity = "Redness / Inflammation", "medium"
            advice = {"en":"Redness detected — possible rash/inflammation. Apply cold compress, see dermatologist.",
                      "hi":"लालिमा पाई गई — रैश/सूजन हो सकती है।","kn":"ಕೆಂಪು ಕಂಡಿದೆ — ದದ್ದು/ಉರಿಯೂತ ಇರಬಹುದು."}
        elif s < 40 and v < 100:
            condition, severity = "Bruising / Contusion", "medium"
            advice = {"en":"Bruising detected. Apply ice, elevate. See doctor if severe.",
                      "hi":"चोट/नील दिखी। बर्फ लगाएं।","kn":"ಗಾಯ ಕಂಡಿದೆ. ಐಸ್ ಹಾಕಿ."}
        elif s > 60 and 10 <= h <= 30:
            condition, severity = "Yellowish Tint (Possible Jaundice)", "high"
            advice = {"en":"Yellow tint detected — possible jaundice. Consult doctor for liver tests immediately.",
                      "hi":"पीलापन दिखा — पीलिया हो सकता है।","kn":"ಹಳದಿ ಕಂಡಿದೆ — ಕಾಮಾಲೆ ಇರಬಹುದು."}
        else:
            condition, severity = "General Skin Area", "low"
            advice = {"en":"No major discoloration. Describe symptoms in chat for detailed analysis.",
                      "hi":"कोई बड़ी असामान्यता नहीं।","kn":"ಯಾವುದೇ ದೊಡ್ಡ ಅಸಹಜತೆ ಇಲ್ಲ."}
        return jsonify({"condition": condition, "severity": severity,
                        "advice": advice.get(lang, advice['en']),
                        "stats": {"hue": round(h,1), "saturation": round(s,1), "brightness": round(v,1)},
                        "image_url": f"/static/uploads/{filename}"})
    except Exception as e:
        return jsonify({"condition":"analyzed","advice":"Image received. Describe symptoms too.",
                        "severity":"low","image_url": f"/static/uploads/{filename}"}), 200

# ══════════════════════════════════════════════════════════════════════════════
# MODULE 12 — HEALTH TIPS & MISC  /api/tips, /api/diseases
# ══════════════════════════════════════════════════════════════════════════════

HEALTH_TIPS = [
    {"en":"💧 Drink 8 glasses of water daily","hi":"💧 दिन में 8 गिलास पानी पिएं","kn":"💧 ದಿನಕ್ಕೆ 8 ಗ್ಲಾಸ್ ನೀರು ಕುಡಿಯಿರಿ"},
    {"en":"🚶 Walk 30 minutes daily","hi":"🚶 प्रतिदिन 30 मिनट चलें","kn":"🚶 ಪ್ರತಿದಿನ 30 ನಿಮಿಷ ನಡೆಯಿರಿ"},
    {"en":"😴 Sleep 7-8 hours nightly","hi":"😴 7-8 घंटे रात को सोएं","kn":"😴 ರಾತ್ರಿ 7-8 ಗಂಟೆ ನಿದ್ರಿಸಿ"},
    {"en":"🥗 Eat 5 fruits/veggies daily","hi":"🥗 हर रोज 5 फल-सब्जियां खाएं","kn":"🥗 5 ಹಣ್ಣು/ತರಕಾರಿ ತಿನ್ನಿ"},
    {"en":"🧘 10 min meditation reduces stress","hi":"🧘 10 मिनट ध्यान तनाव कम करता है","kn":"🧘 10 ನಿಮಿಷ ಧ್ಯಾನ ಒತ್ತಡ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ"},
    {"en":"💊 Never skip prescribed medicines","hi":"💊 दवाइयां कभी न छोड़ें","kn":"💊 ಔಷಧಿ ತಪ್ಪಿಸಬೇಡಿ"},
]

@app.route('/api/tips', methods=['GET'])
def tips():
    """GET /api/tips?lang=en — Get health tips"""
    lang = request.args.get('lang','en')
    return jsonify({"tips": [t.get(lang, t['en']) for t in HEALTH_TIPS]})

@app.route('/api/diseases', methods=['GET'])
def list_diseases():
    """GET /api/diseases — List all diseases in the knowledge base"""
    result = []
    for name, data in DISEASE_DB.items():
        result.append({"name": name, "severity": data['severity'],
                       "icon": data['icon'], "color": data['color'],
                       "symptom_count": len(data['symptoms'])})
    return jsonify({"diseases": result, "total": len(result)})

@app.route('/api/diseases/<string:name>', methods=['GET'])
def get_disease(name):
    """GET /api/diseases/:name — Get full disease info"""
    lang = request.args.get('lang','en')
    if name not in DISEASE_DB:
        return jsonify({"error":"Disease not found"}), 404
    d = DISEASE_DB[name]
    return jsonify({
        "name": name, "severity": d['severity'], "icon": d['icon'],
        "color": d['color'], "symptoms": d['symptoms'],
        "advice": d['advice'].get(lang, d['advice']['en']),
        "precautions": d['precautions'], "common_meds": d['common_meds']
    })

@app.route('/api/dashboard', methods=['GET'])
@token_required
def dashboard():
    """GET /api/dashboard — Aggregated dashboard stats"""
    uid   = request.user['user_id']
    today = datetime.date.today().isoformat()
    conn  = get_db()
    water = conn.execute("SELECT glasses FROM water_intake WHERE user_id=? AND date=?", (uid, today)).fetchone()
    tablets_total = conn.execute("SELECT COUNT(*) as c FROM tablets WHERE user_id=? AND date=?", (uid, today)).fetchone()
    tablets_taken = conn.execute("SELECT COUNT(*) as c FROM tablets WHERE user_id=? AND date=? AND taken=1", (uid, today)).fetchone()
    chat_count    = conn.execute("SELECT COUNT(*) as c FROM chat_history WHERE user_id=?", (uid,)).fetchone()
    latest_bmi    = conn.execute("SELECT * FROM bmi_log WHERE user_id=? ORDER BY recorded_at DESC LIMIT 1", (uid,)).fetchone()
    latest_vitals = conn.execute("SELECT * FROM vitals WHERE user_id=? ORDER BY recorded_at DESC LIMIT 1", (uid,)).fetchone()
    conn.close()
    return jsonify({
        "water": {"glasses": water['glasses'] if water else 0, "goal": 8},
        "tablets": {"total": tablets_total['c'], "taken": tablets_taken['c']},
        "chat_sessions": chat_count['c'],
        "latest_bmi": dict(latest_bmi) if latest_bmi else None,
        "latest_vitals": dict(latest_vitals) if latest_vitals else None,
        "date": today
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """GET /api/health — API health check"""
    return jsonify({"status":"ok","service":"MediBot API","version":"2.0.0",
                    "endpoints":["/api/auth/*","/api/chat","/api/tablets",
                                 "/api/water","/api/bmi","/api/vitals",
                                 "/api/analyze-image","/api/tips","/api/diseases",
                                 "/api/dashboard"]})

if __name__ == '__main__':
    print("=" * 60)
    print("  MediBot REST API — Final Year Project")
    print("  URL: http://127.0.0.1:5000/api/health")
    print("  CORS enabled for http://localhost:3000")
    print("=" * 60)
    app.run(debug=True, port=5000)
