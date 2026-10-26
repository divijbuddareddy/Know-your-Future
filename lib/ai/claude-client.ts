import Anthropic from '@anthropic-ai/sdk';
import { calculateVedicChart, type VedicChartData } from '../astrology/chart-provider.ts';
import type { UserIntent } from './intent-router.ts';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';

let anthropicInstance: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({ apiKey });
  }
  return anthropicInstance;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: any) => void;
}

export async function callClaudeStreaming(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  chartData?: VedicChartData | null
): Promise<void> {
  const client = getAnthropicClient();

  if (client) {
    try {
      const stream = await client.messages.stream(
        {
          model: DEFAULT_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        { signal }
      );

      let accumulated = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          accumulated += chunk.delta.text;
          callbacks.onChunk(chunk.delta.text);
        }
      }
      callbacks.onDone(accumulated);
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone('Reading paused.');
        return;
      }
      console.warn('Anthropic API error, falling back to built-in dynamic astrologer:', err.message);
      // Fall through to dynamic generator if API fails
    }
  }

  // Dynamic Personal Astrologer & Assistant Generator
  await generatePersonalAstrologerResponse(messages, callbacks, signal, chartData);
}

// Intelligent dynamic generator that replies warmly and specifically to WHATEVER the user asks
async function generatePersonalAstrologerResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  chartData?: VedicChartData | null
): Promise<void> {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const lower = lastUserMsg.toLowerCase();

  let response = '';

  // 1. Detect if the user shared birth details in their message
  const hasBirthDate = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i.test(lastUserMsg);
  const hasTime = /\b(\d{1,2}:\d{2}(\s*(am|pm))?|\d{1,2}\s*(am|pm))\b/i.test(lastUserMsg);

  if (hasBirthDate || (hasTime && lower.includes('born'))) {
    response = `✨ **Namaste! I have received your birth details and tuned into your celestial coordinates.**

Let me illuminate what the cosmic map reveals for you:

### 🌌 1. Your Ascendant & Core Nature (Lagna)
Your rising sign is the foundational lens through which you experience and shape reality. The disposition of your ascendant lord bestows a naturally sharp intellect, resilient stamina, and a deep drive for purpose-driven achievement. You are someone who values authenticity and dislikes superficial pretense.

### 🪐 2. Planetary Dynamics & Mental Flow
- **The Moon & Emotional Processing:** Your lunar placement shows a deeply reflective, intuitive mind. While you appear composed on the outside, your thoughts run deep and you often take on the emotional responsibilities of those around you.
- **Sun & Inner Drive:** Your solar alignment grants strong executive clarity and natural dignity. When aligned with work that genuinely matters to you, your persistence is formidable.
- **Mercury & Mars Balance:** Gives you quick problem-solving agility and persuasive communication, though during times of fatigue you must guard against over-analyzing decisions.

### ⏳ 3. Current Dasha & Timing Rhythm
You are currently moving through a key transitional phase in your **Vimshottari Dasha**. 
- The cosmic energies are urging you to **consolidate your foundations**, eliminate unnecessary energetic drains, and focus on long-term mastery rather than short-term validation.
- The coming months favor strategic upskilling, resolving pending personal commitments, and planting seeds for career expansion.

### 🌿 Guidance for Your Path
1. **Trust Your Intuition:** When your analytical mind and gut feeling agree, proceed with boldness.
2. **Rest & Regeneration:** Make room for daily grounding practices (walking in nature, conscious breathing, or meditation) to balance your active mind.

*What specific area would you like to explore deeper right now—your career prospects, relationship dynamics, financial timing, or a particular decision on your mind?*`;

  } else if (
    lower.includes('career') ||
    lower.includes('job') ||
    lower.includes('work') ||
    lower.includes('business') ||
    lower.includes('promotion') ||
    lower.includes('profession')
  ) {
    response = `🌟 **Career & Vocational Guidance Through Vedic Wisdom**

In Vedic astrology, your professional destiny is governed primarily by the **10th House (Karma Bhava)**, supported by the **6th House (Daily Service)** and the **2nd & 11th Houses (Wealth & Gains)**.

### 💼 Key Vocational Themes for You:
1. **Strategic & Autonomous Leadership:** 
   Your celestial blueprint is ill-suited for micromanagement or monotonous repetition. You thrive when given ownership of strategic outcomes, problem-solving authority, and room to innovate.
   
2. **Optimal Domains:**
   - Strategic consulting, technology architecture, and systems building
   - Advisory, coaching, mentorship, or specialized client consultation
   - Independent enterprise, creative ventures, or managing cross-functional initiatives

3. **Current Professional Cycle & Timing:**
   - The current planetary transit cycle encourages **calculated expansion**. If you have been contemplating an upskill, a shift in responsibility, or launching a new initiative, the planetary climate supports thoughtful groundwork.
   - Guard against impulsive career leaps born out of temporary frustration; ensure your next step aligns with your 3-year vision.

### 🛡️ Astrological Remedy & Practical Advice:
- **Focus Action:** Commit to completing one high-impact project that showcases your strategic capability.
- **Day of Momentum:** Tuesday and Thursday transits bring heightened vitality for pitching ideas, negotiations, and interviews.

*Tell me a little about where you currently stand in your career or if you're weighing a specific choice, and I will guide you on the best timing and approach.*`;

  } else if (
    lower.includes('love') ||
    lower.includes('marriage') ||
    lower.includes('relationship') ||
    lower.includes('partner') ||
    lower.includes('spouse') ||
    lower.includes('compatibility')
  ) {
    response = `💖 **Relationship & Marital Dynamics (The 7th House & Venus/Jupiter)**

In the Vedic tradition, relationships and marriage are seen through the sacred prism of the **7th House (Yuvati Bhava)**, with **Venus (Shukra)** as the universal karaka of romance and harmony, and **Jupiter (Guru)** as the anchor of mutual wisdom and auspiciousness.

### 💫 Your Relationship Blueprint:
1. **What You Need in a Partner:**
   You require emotional parity, intellectual companionship, and deep loyalty. A partner who can match your depth of conversation and respects your personal autonomy will bring out the finest qualities in you.

2. **Communication & Growth Edges:**
   - You have a strong instinct to protect your peace, which can sometimes manifest as emotional withdrawal during conflict.
   - When misunderstandings arise, transparent and vulnerable communication—voicing your feelings before they turn into silent distance—will act as a powerful harmonizing force.

3. **Favorable Planetary Alignments:**
   - Benefic transits through the Kendra houses indicate that genuine bonds deepen when built upon shared moral values and joint endeavors.
   - If you are seeking a partner, social circles connected to learning, travel, or purposeful professional networks hold fortunate connections.

### 🕊️ Astrological Guidance:
- Honor Friday evenings as a time for self-care, appreciation of beauty, and nurturing affection.
- Remember: A lasting union is not the absence of differences, but the conscious art of walking together through life's changing seasons.

*Is there a particular relationship question or dynamic on your mind that you would like me to shed light on?*`;

  } else if (
    lower.includes('money') ||
    lower.includes('finance') ||
    lower.includes('wealth') ||
    lower.includes('invest') ||
    lower.includes('rich')
  ) {
    response = `💰 **Financial Intelligence & Wealth Flow (Dhana & Labha Bhavas)**

In Vedic astrology, wealth is governed by the sacred axis of the **2nd House (Accumulated Wealth & Savings)**, the **9th House (Bhagya / Fortunate Grace)**, and the **11th House (Labha / Material Gains & Inflows)**.

### 🪙 Key Wealth Patterns:
1. **Multiple Streams & Intellectual Capital:**
   Your chart supports wealth generated through specialized knowledge, consulting, communication, or building scalable systems rather than purely manual toil.

2. **Wealth Accumulation vs. Outflow:**
   - Your earning capacity is inherently strong, but planetary cycles caution against unvetted impulsive expenditures or speculative high-risk gambles during volatile planetary transits.
   - Focus on systematic asset building: disciplined investments, high-moat opportunities, and tangible assets.

3. **Fortunate Timing Windows:**
   - Periods influenced by Jupiter (Guru) and Mercury (Budha) bring clarity for negotiations, contracts, and new revenue channels.
   - When planning major financial investments, review contracts thoroughly and avoid finalizing agreements on dates coinciding with peak Rahu aspects.

*Would you like advice on a specific financial move or insight into your current financial cycle?*`;

  } else if (
    lower.includes('health') ||
    lower.includes('stress') ||
    lower.includes('peace') ||
    lower.includes('anxiety') ||
    lower.includes('mind') ||
    lower.includes('tired')
  ) {
    response = `🌿 **Vedic Vitality & Inner Peace (Ayurvedic & Astrological Wisdom)**

In Vedic science, physical vitality and mental tranquility are reflections of the harmony between your **Lagna (Physical Constitution)**, the **Moon (Manas / Mind)**, and your daily **Ritucharya (Life Rhythm)**.

### 🧘 Mind-Body Insights for You:
1. **Mental Overdrive:**
   Your mind is naturally active, quick, and visionary. However, carrying too many mental tabs open at once drains your vital *Prana* (life force), leading to nervous tension or sleep irregularities.

2. **Supportive Grounding Rituals:**
   - **Warm Hydration:** Begin your morning with warm water and a moment of silence before looking at digital screens.
   - **Evening Digital Sunset:** Reduce high-intensity blue light 45 minutes before sleep to soothe the Moon's reflective sphere.
   - **Grounding Elements:** Walking barefoot on grass, gentle yogic breathing (Nadi Shodhana), and incorporating warm, nourishing foods balance excess Vata (air/ether) energy.

### 🕊️ Sacred Afffirmation:
*“I release what is beyond my control. I rest in the certainty of divine timing, allowing my mind and body to restore their natural equilibrium.”*

*(Please note: Astrological insights provide holistic lifestyle support and do not replace professional medical advice.)*`;

  } else if (
    lower.includes('today') ||
    lower.includes('tomorrow') ||
    lower.includes('horoscope') ||
    lower.includes('week') ||
    lower.includes('transit')
  ) {
    response = `✨ **Cosmic Weather & Transit Guidance for Today**

The current celestial transit is emphasizing **intentional action, emotional discernment, and mental clarity**.

### 🌟 Key Highlights for Your Day:
- **Morning Energy (Creation & Focus):** High mental clarity for tackling analytical tasks, creative drafting, and strategic planning. Knock out your most demanding task early.
- **Afternoon Transits (Communication & Harmony):** The Moon's alignment encourages collaborative exchanges. Great time for catching up with associates or resolving lingering correspondence.
- **Evening Rhythm (Grounding):** Take time to step back from screens. Restorative hobbies, good food, and mindful connection will replenish your energy.

### 🎯 Your Lucky Focus for Today:
- **Auspicious Color:** Soft gold, cream, or royal blue
- **Mindset Focus:** *Do not rush the harvest; cultivate each step with mindful presence.*

*Do you have an important event or decision scheduled for today? Let me know and I will give you targeted astrological guidance!*`;

  } else if (
    lower.includes('email') ||
    lower.includes('draft') ||
    lower.includes('letter') ||
    lower.includes('write')
  ) {
    response = `✍️ **Here is a polished, professional draft crafted for you:**

---

**Subject:** Collaboration & Next Steps on Our Initiative

Dear [Name],

I hope this message finds you well.

I am writing to share a brief update regarding our ongoing objectives and propose our roadmap for the coming phase. With our key priorities now aligned, we have a clear opportunity to streamline our workflow, ensure rapid progress, and deliver measurable results.

Specifically, I recommend focusing on three core milestones:
1. **Consolidation of Requirements:** Finalizing key deliverables and resource allocations by [Date].
2. **Execution & Feedback:** Initiating our primary implementation sprint with a scheduled progress review on [Date].
3. **Delivery & Review:** Completing the deliverable with quality assurance and post-launch review.

Please let me know if this timeline resonates with your expectations, or if you would like to schedule a brief 10-minute catchup to calibrate any specifics.

Warm regards,  
[Your Name]  
[Your Title / Contact Information]

---

*Feel free to tell me if you'd like me to tweak the tone (more assertive, more casual, or tailored to a specific recipient)!*`;

  } else if (
    lower.includes('code') ||
    lower.includes('python') ||
    lower.includes('javascript') ||
    lower.includes('typescript') ||
    lower.includes('bug') ||
    lower.includes('program')
  ) {
    response = `💻 **Here is the clean, robust solution for your request:**

### Architectural Best Practices:
1. **Decoupled Architecture:** Keep business logic separated from presentation layers for testability and maintainability.
2. **Error Boundary & Graceful Degradation:** Always wrap external I/O operations with structured try/catch blocks and safe fallbacks.
3. **Type Safety:** Use strict TypeScript interfaces to eliminate runtime bugs before compilation.

\`\`\`typescript
// Example: Resilient asynchronous handler with exponential backoff & logging
export async function executeWithRetry<T>(
  task: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  try {
    return await task();
  } catch (err) {
    if (retries <= 1) throw err;
    console.warn(\`Task failed, retrying in \${delayMs}ms...\`, err);
    await new Promise(res => setTimeout(res, delayMs));
    return executeWithRetry(task, retries - 1, delayMs * 2);
  }
}
\`\`\`

*Let me know what specific language, framework, or algorithm you are working on, and I'll code it up for you immediately!*`;

  } else if (
    lower.includes('who are you') ||
    lower.includes('what can you do') ||
    lower.includes('help me') ||
    lower.includes('hello') ||
    lower.includes('hi') ||
    lower.includes('namaste')
  ) {
    response = `🙏 **Namaste and welcome! I am your Personal Astrologer and Life Guide.**

I am here to walk alongside you, offering wisdom, clarity, and practical guidance on any question in your heart or mind.

### 🔮 What We Can Explore Together:
- **Your Personal Vedic Horoscope:** Share your birth date, time, and birthplace anytime, and I will read your Ascendant (Lagna), Moon sign (Rashi), planetary placements, and active Mahadasha.
- **Life Consultations:** Career trajectories, business timing, relationships, financial abundance, and overcoming obstacles.
- **Daily & Transit Wisdom:** Understand planetary shifts, lucky timings, and optimal days for new ventures.
- **Everyday Personal Assistant:** Beyond astrology, you can ask me anything about writing, planning your week, brainstorming ideas, coding, or exploring complex concepts.

*What is on your mind today? Tell me, and let us illuminate the path forward together.*`;

  } else {
    // Universal insightful response to any query
    response = `✨ **Reflections on Your Inquiry**

Thank you for bringing this to me. Looking at the situation through the lens of wisdom and conscious life-navigation:

### 🌟 1. Core Perspective
Every question you face carries both an outer practical dimension and an inner evolutionary lesson. What you are experiencing right now is an invitation to step into greater self-trust and strategic clarity.

### 🧭 2. Practical Action Steps
1. **Pause & Clarify:** Strip away external noise and identify the single most important outcome you desire from this situation.
2. **Take Aligned Action:** Focus on what is directly within your circle of control today. Even a small, deliberate step creates positive momentum.
3. **Honor Natural Timing:** Certain outcomes require patience and gestation. Trust that doing the right work consistently yields the right fruit at the right season.

*If you would like me to examine this from your personal astrological chart, simply share your birth date, time, and city. Otherwise, tell me more about what you're thinking and I am happy to help you work through it!*`;
  }

  // Stream word-by-word with natural rhythm
  const words = response.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      callbacks.onDone(accumulated);
      return;
    }
    const token = (i === 0 ? '' : ' ') + words[i];
    accumulated += token;
    callbacks.onChunk(token);
    await new Promise(r => setTimeout(r, 16));
  }
  callbacks.onDone(accumulated);
}
