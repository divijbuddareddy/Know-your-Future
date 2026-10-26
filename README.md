# 🌟 AI Astrologer & Personal Assistant

A production-minded, chat-first AI Astrologer and versatile personal assistant built with **Next.js 16**, **TypeScript**, **Anthropic Claude API**, and a dedicated high-precision **astronomical ephemeris engine** (`astronomy-engine` with Lahiri Chitrapaksha Ayanamsa).

Grounded in 8 client-provided consulting templates and knowledge documents via **Retrieval-Augmented Generation (RAG)**.

---

## 🔮 Key Capabilities

1. **Dual-Domain Intelligence**:
   - **Vedic Astrology**: In-depth birth chart (Janma Kundli) analysis, Ascendant (Lagna), 9 Grahas (Sun through Ketu), 12 Bhavas, 27 Nakshatras & 4 Padas, Panchanga (Tithi, Vara, Nakshatra, Yoga, Karana), and Vimshottari Mahadasha/Antardasha.
   - **Personal Assistant**: Natural, intelligent answers for coding, writing, research, task planning, and everyday questions without forcing unsolicited astrology.

2. **Deterministic Ephemeris Engine (Zero Hallucination)**:
   - Does **not** ask the LLM to calculate planetary positions from memory.
   - Computes exact tropical ecliptic coordinates and subtracts true Lahiri Ayanamsa to derive sidereal Vedic positions.
   - Passes verified immutable JSON to Claude as system grounding data.

3. **Client-Approved Template Reporting**:
   - **Canonical Master Life Report (120 Minutes Transformation)**: 12 houses, medical tendencies, Gandanthara timing, milestone ages, and life Do’s & Don’ts.
   - **Alternate Transformation Report (120 Minutes)**: 8 structured chapters (Personality, Education, Career, Business, Marriage, Health, Wealth).
   - **Exploration Consultation Report (60 Minutes)**: Deep dives into Shadbala, Yogas, Past life Karma, and Runa debts.
   - **Monthly Astrology Intelligence Report**: 4-week transit analysis, risk zones, and date-wise lucky timings.
   - **Awareness (30m) & Introductory (15m) Reports**.
   - Built-in instant PDF export / printable view.

4. **Security & Privacy Guardrails**:
   - Server-only Claude API client (`ANTHROPIC_API_KEY` is never sent to the browser).
   - User consent required to persist birth coordinates.
   - Prompt-injection defenses and sensitive query interceptor (blocks fatalistic death claims and medical disease diagnoses).
   - Instant profile & data purge controls.

5. **Aesthetics & UX**:
   - Deep Cosmic Navy (`#070B19`, `#0D1527`), warm celestial gold accents, glassmorphic cards, smooth micro-animations.
   - Live SSE token streaming, message markdown rendering, source tags, copy controls, and suggested prompt cards.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **npm**: v10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your Anthropic Claude API key:
```env
# Server-side Claude API authentication (never prefix with NEXT_PUBLIC_)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-7-sonnet-20250219

# Application & Session Settings
APP_BASE_URL=http://localhost:3000
AUTH_SECRET=astrologer_dev_secret_key_super_secure_random_hash_987654321

# Database Configuration
DATABASE_URL=file:./data/astrologer.db
OBJECT_STORAGE_BUCKET=private-ai-astrologer
```
*(Note: If no API key is set, the application operates in an intelligent grounded simulation mode so reviewers can test all UI flows, chart math, reports, and RAG retrieval offline).*

### 4. Run Automated Test Suite
Verify that all 22 test cases pass (ephemeris math, intent routing, RAG retrieval, prompt secrecy):
```bash
npm test
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 🏛️ System Architecture

```
ai-astrologer/
├── app/
│   ├── api/
│   │   ├── admin/documents/route.ts  # Lists 8 indexed client RAG docs
│   │   ├── astrology/chart/route.ts  # Direct ephemeris calculation API
│   │   ├── chat/route.ts             # SSE streaming chat with intent routing
│   │   ├── conversations/route.ts    # List & create conversations
│   │   ├── conversations/[id]/route.ts # Load, rename, delete chat
│   │   ├── profile/route.ts          # Save & retrieve birth profile
│   │   └── reports/route.ts          # Generate & list structured reports
│   ├── layout.tsx                    # Root layout with fonts & meta
│   ├── page.tsx                      # Primary chat workspace
│   └── globals.css                   # Custom celestial theme design system
├── components/
│   ├── chat/
│   │   ├── ChatSidebar.tsx           # Sidebar with chats, modals, new chat
│   │   ├── ChatHeader.tsx            # Title rename & model status badge
│   │   ├── MessageList.tsx           # Formatted markdown messages & sources
│   │   ├── MessageComposer.tsx       # Multiline textarea with Shift+Enter
│   │   └── PromptCards.tsx           # Suggested prompt cards
│   └── modals/
│       ├── BirthProfileModal.tsx     # Birth inputs, consent, and chart table
│       ├── ReportViewerModal.tsx     # Report preview & PDF export
│       └── KnowledgeBaseModal.tsx    # Admin inspection of 8 indexed docs
├── lib/
│   ├── ai/
│   │   ├── claude-client.ts          # Server-only Anthropic SDK integration
│   │   ├── intent-router.ts          # Intent detection & safety filter
│   │   └── prompts.ts                # Grounded prompt construction
│   ├── astrology/
│   │   ├── chart-provider.ts         # High-precision Lahiri ephemeris engine
│   │   └── vedic-definitions.ts      # Rashis, Bhavas, Nakshatras, Dashas
│   ├── rag/
│   │   ├── knowledge-store.ts        # Search & metadata filter
│   │   └── knowledge-data.json       # 129 indexed chunks from 8 DOCX files
│   └── db/
│       └── store.ts                  # Persistent local database store
└── tests/
    └── test-suite.mjs                # 22 automated system tests
```

---

## 🧪 Evaluation & Testing Checklist

| Test Category | Tested Behavior | Status |
|---|---|---|
| **Ephemeris Precision** | Verified Lahiri ayanamsa (~23.7°–24.0°), 9 Grahas, Ascendant Lagna, Nakshatras & Padas | ✅ Verified |
| **Panchanga & Dasha** | Computed Tithi, Vara, Nakshatra, Yoga, Karana & active Vimshottari Mahadasha/Antardasha | ✅ Verified |
| **General Assistant** | Questions on coding, email drafting, or planning answered without unsolicited astrology | ✅ Verified |
| **Intent Switching** | Seamless switching between astrology and everyday productivity questions | ✅ Verified |
| **Missing Birth Data** | Explains missing inputs and prompts to configure birth coordinates | ✅ Verified |
| **Sensitive Guardrails** | Intercepts fatalistic claims, prompt injections, and medical disease diagnoses | ✅ Verified |
| **RAG Grounding** | Matches client consultation templates and extracts 7th house / transit passages | ✅ Verified |
| **PDF & Reports** | End-to-end report generation with formatted chapters and print-to-PDF | ✅ Verified |

---

## 📜 Ethical & Legal Disclaimer
*This product provides astrological interpretations and life-coaching perspectives strictly for personal exploration and reflection. Astrological guidance is not a scientific diagnosis, legal determination, or financial guarantee. For medical concerns, always consult a licensed healthcare professional.*
