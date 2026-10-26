import fs from 'fs';
import path from 'path';
import { calculateVedicChart, type VedicChartData, type BirthInput } from '../astrology/chart-provider.ts';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  intent?: string;
  sources?: { docTitle: string; heading: string }[];
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
}

export interface StoredBirthProfile {
  id: string;
  fullName: string;
  gender?: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  timeConfidence: 'exact' | 'approximate' | 'unknown';
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  consentToSave: boolean;
  chartData?: VedicChartData;
  updatedAt: string;
}

export interface StoredReport {
  id: string;
  conversationId?: string;
  templateType: string;
  title: string;
  nativeName: string;
  contentMarkdown: string;
  createdAt: string;
}

export interface AppDatabase {
  conversations: StoredConversation[];
  birthProfile: StoredBirthProfile | null;
  reports: StoredReport[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'astrologer_db.json');

const INITIAL_DB: AppDatabase = {
  conversations: [
    {
      id: 'default-conv-1',
      title: 'Welcome to AI Astrologer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome-msg-1',
          role: 'assistant',
          content: 'Hello! I can help you explore astrology, create a personalized report, or answer everyday questions. What would you like to talk about?',
          createdAt: new Date().toISOString(),
          intent: 'GENERAL_ASSISTANT'
        }
      ]
    }
  ],
  birthProfile: {
    id: 'sample-profile-1',
    fullName: 'Alex Sharma',
    gender: 'male',
    birthDate: '1992-08-18',
    birthTime: '10:45',
    timeConfidence: 'exact',
    birthPlace: 'New Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezoneOffset: 5.5,
    consentToSave: true,
    updatedAt: new Date().toISOString(),
    chartData: calculateVedicChart({
      name: 'Alex Sharma',
      birthDate: '1992-08-18',
      birthTime: '10:45',
      latitude: 28.6139,
      longitude: 77.2090,
      timezoneOffset: 5.5,
      timeConfidence: 'exact'
    })
  },
  reports: []
};

function ensureDataFile(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading astrologer_db.json, using fallback:', err);
    return INITIAL_DB;
  }
}

function saveDb(db: AppDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting astrologer_db.json:', err);
  }
}

// Conversation Operations
export function listConversations(): StoredConversation[] {
  const db = ensureDataFile();
  return db.conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getConversation(id: string): StoredConversation | undefined {
  const db = ensureDataFile();
  return db.conversations.find(c => c.id === id);
}

export function createConversation(title = 'New Consultation'): StoredConversation {
  const db = ensureDataFile();
  const newConv: StoredConversation = {
    id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: 'Hello! I can help you explore astrology, create a personalized report, or answer everyday questions. What would you like to talk about?',
        createdAt: new Date().toISOString(),
        intent: 'GENERAL_ASSISTANT'
      }
    ]
  };
  db.conversations.unshift(newConv);
  saveDb(db);
  return newConv;
}

export function updateConversationTitle(id: string, title: string): boolean {
  const db = ensureDataFile();
  const conv = db.conversations.find(c => c.id === id);
  if (!conv) return false;
  conv.title = title;
  conv.updatedAt = new Date().toISOString();
  saveDb(db);
  return true;
}

export function deleteConversation(id: string): boolean {
  const db = ensureDataFile();
  const idx = db.conversations.findIndex(c => c.id === id);
  if (idx === -1) return false;
  db.conversations.splice(idx, 1);
  saveDb(db);
  return true;
}

export function addMessageToConversation(conversationId: string, message: Omit<StoredMessage, 'id' | 'createdAt'>): StoredMessage {
  const db = ensureDataFile();
  let conv = db.conversations.find(c => c.id === conversationId);
  if (!conv) {
    conv = createConversation('New Consultation');
  }

  const newMsg: StoredMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    role: message.role,
    content: message.content,
    createdAt: new Date().toISOString(),
    intent: message.intent,
    sources: message.sources
  };

  conv.messages.push(newMsg);
  conv.updatedAt = new Date().toISOString();

  // If this was first user message, update title concisely
  if (conv.messages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
    conv.title = message.content.slice(0, 32).trim() + (message.content.length > 32 ? '...' : '');
  }

  saveDb(db);
  return newMsg;
}

// Profile Operations
export function getSavedBirthProfile(): StoredBirthProfile | null {
  const db = ensureDataFile();
  return db.birthProfile;
}

export function saveBirthProfile(profileData: Omit<StoredBirthProfile, 'id' | 'chartData' | 'updatedAt'>): StoredBirthProfile {
  const db = ensureDataFile();

  const chartData = calculateVedicChart({
    name: profileData.fullName,
    birthDate: profileData.birthDate,
    birthTime: profileData.birthTime,
    latitude: profileData.latitude,
    longitude: profileData.longitude,
    timezoneOffset: profileData.timezoneOffset,
    timeConfidence: profileData.timeConfidence
  });

  const profile: StoredBirthProfile = {
    id: db.birthProfile?.id || 'prof-' + Date.now(),
    ...profileData,
    chartData,
    updatedAt: new Date().toISOString()
  };

  db.birthProfile = profile;
  saveDb(db);
  return profile;
}

export function deleteBirthProfile(): boolean {
  const db = ensureDataFile();
  db.birthProfile = null;
  saveDb(db);
  return true;
}

// Report Operations
export function listReports(): StoredReport[] {
  const db = ensureDataFile();
  return db.reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReport(id: string): StoredReport | undefined {
  const db = ensureDataFile();
  return db.reports.find(r => r.id === id);
}

export function saveReport(report: Omit<StoredReport, 'id' | 'createdAt'>): StoredReport {
  const db = ensureDataFile();
  const newReport: StoredReport = {
    id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    ...report,
    createdAt: new Date().toISOString()
  };
  db.reports.unshift(newReport);
  saveDb(db);
  return newReport;
}

export function deleteReport(id: string): boolean {
  const db = ensureDataFile();
  const idx = db.reports.findIndex(r => r.id === id);
  if (idx === -1) return false;
  db.reports.splice(idx, 1);
  saveDb(db);
  return true;
}
