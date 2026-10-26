import { NextRequest, NextResponse } from 'next/server';
import { listReports, saveReport, getSavedBirthProfile } from '@/lib/db/store.ts';
import { getCanonicalTemplate } from '@/lib/rag/knowledge-store.ts';
import { calculateVedicChart } from '@/lib/astrology/chart-provider.ts';

const TEMPLATE_NAMES: Record<string, string> = {
  monthly_report: 'Monthly Astrology Intelligence Report',
  transformation_120m: 'Master Life Report (Canonical Transformation Consultation)',
  alternate_120m: 'Master Life Report (Alternate Transformation Consultation)',
  exploration_60m: 'Master Life Report (Exploration Consultation)',
  introductory_15m: 'Astrology Life Report (Introductory Consultation)',
  personality_15m: 'Personality Description (Basic Discussion)',
  awareness_30m: 'Astrology Life Report (Awareness Consultation)',
  summarize_prompt: 'Astrology Executive Outcome Summary'
};

export async function GET() {
  try {
    const reports = listReports();
    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateType = 'transformation_120m', conversationId } = body;

    const profile = getSavedBirthProfile();
    if (!profile || !profile.chartData) {
      return NextResponse.json({
        error: 'A birth profile with verified chart coordinates is required before generating a full report. Please save a birth profile first.'
      }, { status: 400 });
    }

    const chart = profile.chartData;
    const templateTitle = TEMPLATE_NAMES[templateType] || 'Vedic Astrology Life Report';
    const nowStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Build the structured report following the exact client template
    let contentMarkdown = `# ${templateTitle}\n\n`;
    contentMarkdown += `**Native:** ${profile.fullName} | **Date of Birth:** ${profile.birthDate} | **Time:** ${profile.birthTime} (${profile.timeConfidence})\n`;
    contentMarkdown += `**Birthplace:** ${profile.birthPlace} | **Generated:** ${nowStr}\n`;
    contentMarkdown += `**Calculation Method:** ${chart.calculationEngine} (Ayanamsa: ${chart.ayanamsaName} ${chart.ayanamsaValueDeg}°)\n\n`;
    contentMarkdown += `---\n\n`;

    if (templateType === 'monthly_report') {
      contentMarkdown += `## 🧠 Executive Summary
This Monthly Astrology Intelligence Report translates planetary movements into practical decision guidelines for personal growth, career positioning, and financial clarity.

## 📅 Week-Wise Analysis & Momentum
- **Week 1 (Days 1–7):** Strong focus on foundational planning and personal consolidation. Mars energy supports initiative, but patience is recommended before executing large capital deployments.
- **Week 2 (Days 8–14):** Mercury alignments favor negotiations, contracts, and strategic communication. Excellent window for client pitches and creative output.
- **Week 3 (Days 15–21):** Solar transit enhances visibility and executive presence. Ideal for public presentations and seeking advisory support.
- **Week 4 (Days 22–31):** Saturnian grounding encourages review of operational habits and health routines.

## 💼 Business & Finance Strategy
- **Capital Allocation:** Emphasize high-moat opportunities and steady recurring yields.
- **Partnerships:** Scrutinize contractual details before committing to long-term joint ventures.

## ⚠️ Risk Zones & Recommended Precautions
- Avoid reactive responses during midweek planetary shifts.
- Maintain adequate sleep hygiene to counteract mental fatigue.

## 🌟 Date-Wise Lucky Timing System
- **High Opportunity Days:** 4th, 11th, 18th, 25th of the month.
- **Low Profile / Caution Days:** 9th, 16th, 23rd.

## 🎯 Final Strategic Message
*“Wisdom lies in aligning conscious effort with the rhythm of natural cycles. Treat challenges as diagnostic signals for strategic refinement.”*`;

    } else if (templateType === 'transformation_120m' || templateType === 'alternate_120m') {
      contentMarkdown += `## 1. Physical Appearance & Basic Nature
The native possesses an ascendant in **${chart.lagna.rashi}** at ${chart.lagna.formattedDegree} in **${chart.lagna.nakshatra}** Nakshatra (Pada ${chart.lagna.pada}).
- **Physical Demeanor:** Reflects poise, dignified bearing, and an alert communicative presence. The countenance conveys quiet confidence and intellectual curiosity.
- **Temperament:** A balanced synthesis of strategic vision and pragmatic execution. You naturally attract responsibility due to the structural influences of ${chart.lagna.nakshatraLord}.

## 2. Panchanga-Based Personality Insights
- **Vara (Day):** ${chart.panchanga.vara} — grants persistence, endurance, and fortitude in leadership.
- **Tithi:** ${chart.panchanga.tithi.name} — highlights an innate drive for moral alignment and clarity of purpose.
- **Nakshatra:** ${chart.panchanga.nakshatra} (Moon) — bestows acute emotional sensitivity paired with strong analytical capabilities.
- **Yoga:** ${chart.panchanga.yoga} — facilitates harmonious social relationships and long-term goodwill.
- **Karana:** ${chart.panchanga.karana} — supports methodical follow-through on complex assignments.

## 3. Rashi Chart & 12 Bhavas Comprehensive Analysis
${chart.bhavas.map(b => `### ${b.title} (${b.rashi})
- **Core Life Focus:** ${b.themes}
- **Resident Planetary Forces:** ${b.planetsInBhava.length > 0 ? b.planetsInBhava.join(', ') : 'No direct planetary occupancy; ruled by ' + b.rashi + ' lord.'}
`).join('\n')}

## 4. Career, Profession & Wealth Milestones
- **Primary Vocational Alignment:** Strategic consulting, managerial oversight, financial architecture, and technical innovation.
- **Key Wealth Windows:** Benefic planetary periods highlight capital appreciation during dasha sub-periods ruled by Venus and Jupiter.
- **Foreign Connections:** Strong indications for international collaboration or remote global engagements.

## 5. Marriage & Relationship Architecture
- **7th Bhava Dynamic:** Governed by ${chart.bhavas[6].rashi}. Favors relationships established on shared values, intellectual parity, and transparent expectations.
- **Marital Prosperity:** Harmonious when communication channels remain candid and regular periods of independent reflection are preserved.

## 6. Health & Vitality Guardrails
- **Constitutional Balance:** Maintain awareness of metabolic rhythms and digestive fire.
- **Preventive Lifestyle:** Regular hydration, seasonal detoxifying nutrition, and moderate aerobic movement are highly supportive.

## 7. Current Dasha Roadmap (Vimshottari)
- **Active Mahadasha:** **${chart.currentDasha.mahadasha}** (~${chart.currentDasha.remainingYearsInMahadasha} years remaining)
- **Active Antardasha:** **${chart.currentDasha.antardasha}**
- **Actionable Advice:** This phase prioritizes institutional grounding, skills enhancement, and eliminating unnecessary liabilities.

## 8. Do's and Don'ts of Life
- **DO:** Trust your analytical instincts; document long-term strategic plans; honor daily restorative routines.
- **DON'T:** Let haste compromise critical contract reviews; avoid speculative financial gambles during Rahu transit overlaps.`;

    } else {
      // General structured overview for other templates
      contentMarkdown += `## 1. Core Natal Overview
- **Ascendant (Lagna):** ${chart.lagna.rashi} (${chart.lagna.formattedDegree})
- **Moon Sign (Rashi):** ${chart.planets.find(p => p.name === 'Moon')?.rashi || 'Unknown'} (${chart.panchanga.nakshatra})
- **Sun Sign:** ${chart.planets.find(p => p.name === 'Sun')?.rashi || 'Unknown'}

## 2. Immediate Planetary Influences
- Active Mahadasha: **${chart.currentDasha.mahadasha}** / Antardasha: **${chart.currentDasha.antardasha}**
- Key strengths include sustained focus, disciplined work ethic, and communicative clarity.

## 3. Practical Counsel
Focus on strengthening your primary professional domain while maintaining healthy boundaries in personal relationships.`;
    }

    contentMarkdown += `\n\n---\n*Disclaimer: This report is an astrological and psychological interpretation generated for personal reflection and guidance. It is not intended as financial, legal, or medical advice.*`;

    const saved = saveReport({
      conversationId,
      templateType,
      title: `${templateTitle} — ${profile.fullName}`,
      nativeName: profile.fullName,
      contentMarkdown
    });

    return NextResponse.json({ report: saved }, { status: 201 });
  } catch (err: any) {
    console.error('Error generating report:', err);
    return NextResponse.json({ error: 'Failed to generate report: ' + err.message }, { status: 500 });
  }
}
