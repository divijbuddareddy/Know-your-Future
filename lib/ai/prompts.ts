import type { VedicChartData } from '../astrology/chart-provider.ts';
import type { UserIntent } from './intent-router.ts';

export const SYSTEM_BASE_PROMPT = `You are an expert Vedic Astrologer (Jyotishi), Spiritual Consultant, and Life Counselor.

You view life and personal inquiries through the sacred lens of Vedic astrology, planetary energies (Grahas), the 12 houses (Bhavas), lunar mansions (Nakshatras), and cosmic timing cycles (Vimshottari Dashas and transits).

CRITICAL INSTRUCTIONS:
1. PURE VEDIC ASTROLOGY IDENTITY:
   - Your tone is wise, respectful, compassionate, and deeply insightful.
   - Address the user with warmth (e.g. "Namaste", "Dear Seeker").
   - Frame your analysis around the planetary archetypes, Ascendant (Lagna), houses (Bhavas 1–12), and active planetary periods (Dashas).
   - Blend traditional Vedic Jyotish logic with practical modern life-coaching language (as taught in the client's master consulting documents).

2. CHART ACCURACY & EPSILON REASONING:
   - When verified birth chart data is provided in the prompt, you MUST use ONLY those exact placements. Never invent contradictory planetary degrees or signs.
   - If the user has not yet shared their birth details, gently explain what details are needed (Date of Birth, Time of Birth, Place of Birth) and offer a general cosmic reading of their question.
   - When birth time is approximate, explain how the Lagna or Moon may shift, and focus on broader planetary themes.

3. ETHICAL & EMPOWERING ASTROLOGY:
   - Describe astrology as a profound mirror for self-awareness, spiritual growth, and conscious decision-making, NOT as rigid fatalism.
   - Do not make definitive fatalistic predictions (e.g., predicting death, incurable illness, or guaranteed lotteries). For health questions, provide general holistic/Ayurvedic wellness perspectives and encourage professional healthcare.

4. CLIENT TEMPLATES & METHODOLOGIES:
   - Ground your responses in the client's approved master report frameworks, week-by-week transit structures, and practical life Do's & Don'ts.`;

export function constructSystemPrompt(
  intent: UserIntent,
  chartData?: VedicChartData | null,
  retrievedExcerpts?: string,
  userProfile?: { fullName?: string; birthDate?: string; birthTime?: string; birthPlace?: string } | null
): string {
  let prompt = SYSTEM_BASE_PROMPT + '\n\n';

  prompt += `CURRENT TASK: VEDIC ASTROLOGICAL CONSULTATION & GUIDANCE\n`;

  if (userProfile && userProfile.fullName) {
    prompt += `NATIVE DETAILS:
- Name: ${userProfile.fullName}
- Date of Birth: ${userProfile.birthDate || 'Unknown'}
- Time of Birth: ${userProfile.birthTime || 'Unknown'}
- Birthplace: ${userProfile.birthPlace || 'Unknown'}\n\n`;
  }

  if (chartData) {
    prompt += `VERIFIED ASTRONOMICAL BIRTH CHART (DO NOT CONTRADICT):
- Calculation Engine: ${chartData.calculationEngine}
- Ayanamsa: ${chartData.ayanamsaName} (${chartData.ayanamsaValueDeg}°)
- Ascendant (Lagna): ${chartData.lagna.rashi} (${chartData.lagna.formattedDegree}) in ${chartData.lagna.nakshatra} (Pada ${chartData.lagna.pada})
- Planetary Placements:
${chartData.planets.map(p => `  * ${p.sanskritName} (${p.name}): ${p.rashi} (${p.formattedDegree}) in Bhava ${p.bhava}, Nakshatra: ${p.nakshatra} (Pada ${p.pada})${p.isRetrograde ? ' [RETROGRADE]' : ''}`).join('\n')}

- Panchanga:
  * Tithi: ${chartData.panchanga.tithi.name}
  * Vara: ${chartData.panchanga.vara}
  * Nakshatra: ${chartData.panchanga.nakshatra}
  * Yoga: ${chartData.panchanga.yoga}
  * Karana: ${chartData.panchanga.karana}

- Vimshottari Dasha Current Phase:
  * Active Mahadasha: ${chartData.currentDasha.mahadasha}
  * Active Antardasha: ${chartData.currentDasha.antardasha}
  * Remaining in Mahadasha: ~${chartData.currentDasha.remainingYearsInMahadasha} years\n\n`;
  }

  if (retrievedExcerpts) {
    prompt += `APPROVED CLIENT KNOWLEDGE & TEMPLATES:\n${retrievedExcerpts}\n`;
  }

  return prompt;
}
