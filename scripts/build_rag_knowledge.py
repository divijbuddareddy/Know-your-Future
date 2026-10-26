import os, glob, json, sys

sys.stdout.reconfigure(encoding='utf-8')

category_map = {
    '1__1_1_MONTHLY_ASTROLOGY_INTELLIGENCE_REPORT': {
        'id': 'monthly_report',
        'title': 'Monthly Astrology Intelligence Report',
        'category': 'Monthly Transit Report',
        'durationMinutes': 30,
        'description': 'Practical decision guidance for business, finance, mental patterns, risk zones, and date-wise lucky timings based on monthly transits.'
    },
    '1__Astrology_life_reportIntroductory_consultation_consultation_15_minutes': {
        'id': 'introductory_15m',
        'title': 'Introductory Consultation Life Report (15 Minutes)',
        'category': 'Quick Consultation',
        'durationMinutes': 15,
        'description': 'Concise, professional natal overview covering core identity, current dasha phase, and immediate guidance.'
    },
    '1_1_Personality_DescriptionBasic_Discussion_15_minutes': {
        'id': 'personality_15m',
        'title': 'Personality Description & Basic Discussion (15 Minutes)',
        'category': 'Personality Analysis',
        'durationMinutes': 15,
        'description': 'Deep dive into physical appearance, core psychological temperament, communication style, and blind spots.'
    },
    '1_2_Master_life_reportExploration_Consultation_60_minutes': {
        'id': 'exploration_60m',
        'title': 'Master Life Report — Exploration Consultation (60 Minutes)',
        'category': 'In-Depth Exploration',
        'durationMinutes': 60,
        'description': 'Comprehensive 12 Bhavas, 9 Grahas, Panchanga, Shadbala, Yogas, Past life Karma, Debts (Runa), Curses (Shaapa), and multi-dasha analysis.'
    },
    '1_3_Master_life_reportTransformation_Consultation_120_minutes': {
        'id': 'transformation_120m',
        'title': 'Master Life Report — Canonical Transformation Consultation (120 Minutes)',
        'category': 'Canonical Master Report',
        'durationMinutes': 120,
        'description': 'The definitive life biography: Medical astrology, Gandanthara timing, Fortunate event milestones (marriage, childbirth, wealth windfalls), and Do’s & Don’ts.'
    },
    '1_4_Master_life_reportAlternate_Transformation_Consultation_120_minutes': {
        'id': 'alternate_120m',
        'title': 'Master Life Report — Alternate Transformation Consultation (120 Minutes)',
        'category': 'Modular Life Report',
        'durationMinutes': 120,
        'description': '8 structured chapters: Personality, Education (India vs Abroad), Career, Business Potential & Luck, Marriage & Compatibility, Health, and Wealth.'
    },
    '1_5_Astrology_life_reportAwarness_consultation_30_minutes': {
        'id': 'awareness_30m',
        'title': 'Astrology Life Report — Awareness Consultation (30 Minutes)',
        'category': 'Life Awareness Report',
        'durationMinutes': 30,
        'description': 'Five key life pillars: Personality Traits, Education milestones, Career trajectories (job vs business), Marriage dynamics, and Progeny.'
    },
    '1_6_Summarize_prompt': {
        'id': 'summarize_prompt',
        'title': 'Executive Outcome Summarization Framework',
        'category': 'Summary Framework',
        'durationMinutes': 5,
        'description': 'Distills complex astrological analyses into crisp, outcome-driven bullet points without technical jargon.'
    }
}

txt_files = sorted(glob.glob('knowledge_sources/*.txt'))
docs = []

for tf in txt_files:
    basename = os.path.splitext(os.path.basename(tf))[0]
    meta = category_map.get(basename, {
        'id': basename,
        'title': basename,
        'category': 'General Reference',
        'durationMinutes': 0,
        'description': ''
    })
    with open(tf, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    paragraphs = [p.strip() for p in raw_text.split('\n\n') if p.strip()]
    
    chunks = []
    current_chunk = []
    current_heading = 'Introduction'
    
    for p in paragraphs:
        if (p.isupper() and len(p) < 80) or p.startswith('CHAPTER') or p.startswith('⭐') or (len(p) > 2 and p[0].isdigit() and p[1] == '.'):
            if current_chunk:
                chunks.append({
                    'heading': current_heading,
                    'content': '\n\n'.join(current_chunk),
                    'charCount': sum(len(x) for x in current_chunk)
                })
                current_chunk = []
            current_heading = p[:80]
        current_chunk.append(p)
    if current_chunk:
        chunks.append({
            'heading': current_heading,
            'content': '\n\n'.join(current_chunk),
            'charCount': sum(len(x) for x in current_chunk)
        })

    docs.append({
        'id': meta['id'],
        'title': meta['title'],
        'category': meta['category'],
        'durationMinutes': meta['durationMinutes'],
        'description': meta['description'],
        'rawLength': len(raw_text),
        'chunks': chunks
    })

os.makedirs('lib/rag', exist_ok=True)
with open('lib/rag/knowledge-data.json', 'w', encoding='utf-8') as out:
    json.dump(docs, out, indent=2, ensure_ascii=False)

total_chunks = sum(len(d['chunks']) for d in docs)
print(f'Indexed {len(docs)} knowledge documents with {total_chunks} structured chunks.')
