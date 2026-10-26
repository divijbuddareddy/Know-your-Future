export type UserIntent =
  | 'ASTROLOGY'
  | 'REPORT_REQUEST'
  | 'GENERAL_ASSISTANT'
  | 'PROFILE_UPDATE'
  | 'UNSUPPORTED_OR_SENSITIVE';

export interface IntentAnalysis {
  intent: UserIntent;
  confidence: number;
  detectedTemplateId?: string;
  isPersonalizedAstrology: boolean;
  needsBirthProfile: boolean;
  reason: string;
}

const REPORT_TRIGGERS: { pattern: RegExp; templateId: string }[] = [
  { pattern: /monthly/i, templateId: 'monthly_report' },
  { pattern: /transformation|120\s*min|master\s*life\s*report/i, templateId: 'transformation_120m' },
  { pattern: /exploration|60\s*min/i, templateId: 'exploration_60m' },
  { pattern: /introductory|intro\b|15\s*min.*consult/i, templateId: 'introductory_15m' },
  { pattern: /personality.*15\s*min|appearance/i, templateId: 'personality_15m' },
  { pattern: /awareness|30\s*min/i, templateId: 'awareness_30m' },
  { pattern: /alternate|modular.*report/i, templateId: 'alternate_120m' },
  { pattern: /summarize|summary\s*prompt/i, templateId: 'summarize_prompt' },
];

const ASTROLOGY_KEYWORDS = [
  'astrology', 'horoscope', 'birth chart', 'natal chart', 'kundli', 'kundali',
  'lagna', 'rashi', 'nakshatra', 'dasha', 'mahadasha', 'antardasha',
  'graha', 'planet', 'bhava', 'house', 'saturn', 'jupiter', 'mars', 'venus',
  'mercury', 'sun', 'moon', 'rahu', 'ketu', 'shani', 'guru', 'mangala',
  'vedic', 'jyotish', 'panchanga', 'tithi', 'yoga', 'karana', 'zodiac',
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces', 'compatibility', 'synastry',
  'gandanthara', 'dosha', 'shadbala', 'navamsha'
];

const SENSITIVE_PATTERNS = [
  /\b(diagnose|cure|treatment|medical\s+advice)\b.*?\b(cancer|diabetes|disease|illness|tumor|infection)\b/i,
  /\b(cancer|diabetes|disease|illness|tumor)\b.*?\b(diagnose|cure|treatment)\b/i,
  /\bdiagnose\b/i,
  /will\s+i\s+die/i,
  /death\s+date/i,
  /guaranteed\s+(lottery|stock|money|jackpot)/i,
  /ignore\s+(all\s+previous|all\s+rules|system\s+instructions)/i,
  /reveal\s+(api\s*key|system\s*prompt|secret)/i
];

export function detectIntent(
  message: string,
  hasActiveProfile: boolean
): IntentAnalysis {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check for prompt injection or sensitive/fatalistic questions
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'UNSUPPORTED_OR_SENSITIVE',
        confidence: 0.95,
        isPersonalizedAstrology: false,
        needsBirthProfile: false,
        reason: 'Detected sensitive health, fatalistic, or security-adversarial query.'
      };
    }
  }

  // 2. Check for report generation intent
  const isReportRequest =
    /(generate|create|build|write|produce|make|export)\s+(a\s+)?(report|reading|biography|analysis)/i.test(lower) ||
    REPORT_TRIGGERS.some(t => t.pattern.test(lower) && /(report|analysis|consultation)/i.test(lower));

  if (isReportRequest) {
    const matched = REPORT_TRIGGERS.find(t => t.pattern.test(lower));
    const templateId = matched ? matched.templateId : 'transformation_120m';
    return {
      intent: 'REPORT_REQUEST',
      confidence: 0.9,
      detectedTemplateId: templateId,
      isPersonalizedAstrology: true,
      needsBirthProfile: !hasActiveProfile,
      reason: `User requested report template: ${templateId}`
    };
  }

  // 3. Check for birth profile updating intent
  if (
    /(born\s+on|my\s+dob|date\s+of\s+birth|my\s+birth\s+time|born\s+in|birth\s+place)/i.test(lower) &&
    /\d{4}|\d{1,2}:\d{2}/.test(lower)
  ) {
    return {
      intent: 'PROFILE_UPDATE',
      confidence: 0.85,
      isPersonalizedAstrology: true,
      needsBirthProfile: false,
      reason: 'Detected birth details in user message.'
    };
  }

  // 4. Check for personalized vs general astrology
  let astroScore = 0;
  for (const kw of ASTROLOGY_KEYWORDS) {
    if (lower.includes(kw)) {
      astroScore++;
    }
  }

  const isPersonalQuery = /\b(my|i|mine|me)\b/i.test(lower);

  if (astroScore > 0) {
    return {
      intent: 'ASTROLOGY',
      confidence: Math.min(0.6 + astroScore * 0.1, 0.98),
      isPersonalizedAstrology: isPersonalQuery,
      needsBirthProfile: isPersonalQuery && !hasActiveProfile,
      reason: `Matched ${astroScore} astrological concepts; personal=${isPersonalQuery}`
    };
  }

  // 5. Default to General Personal Assistant
  return {
    intent: 'GENERAL_ASSISTANT',
    confidence: 0.85,
    isPersonalizedAstrology: false,
    needsBirthProfile: false,
    reason: 'Standard personal assistant inquiry (writing, coding, planning, concepts).'
  };
}
