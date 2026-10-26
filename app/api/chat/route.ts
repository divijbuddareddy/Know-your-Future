import { NextRequest, NextResponse } from 'next/server';
import { detectIntent } from '@/lib/ai/intent-router.ts';
import { constructSystemPrompt } from '@/lib/ai/prompts.ts';
import { callAIStreaming, type AIProvider } from '@/lib/ai/multi-provider.ts';
import { searchKnowledge, formatRetrievedContext } from '@/lib/rag/knowledge-store.ts';
import {
  getSavedBirthProfile,
  saveBirthProfile,
  getConversation,
  addMessageToConversation
} from '@/lib/db/store.ts';

export const runtime = 'nodejs';

function tryExtractBirthDetails(text: string) {
  try {
    const lower = text.toLowerCase();
    const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (!yearMatch) return null;

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let monthIdx = -1;
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i])) {
        monthIdx = i + 1;
        break;
      }
    }
    const dayMatch = text.match(/\b([1-9]|[12]\d|3[01])(st|nd|rd|th)?\b/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 15;
    const year = parseInt(yearMatch[1], 10);
    const month = monthIdx > 0 ? (monthIdx < 10 ? '0' + monthIdx : '' + monthIdx) : '06';
    const dayStr = day < 10 ? '0' + day : '' + day;
    const birthDate = `${year}-${month}-${dayStr}`;

    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i) || text.match(/(\d{1,2})\s*(am|pm)/i);
    let birthTime = '12:00';
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      let m = timeMatch[2] && !isNaN(parseInt(timeMatch[2], 10)) ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = (timeMatch[3] || timeMatch[2] || '').toLowerCase();
      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;
      birthTime = `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
    }

    let birthPlace = 'Delhi, India';
    let lat = 28.6139;
    let lon = 77.2090;
    let tz = 5.5;

    if (lower.includes('mumbai')) { birthPlace = 'Mumbai, India'; lat = 19.0760; lon = 72.8777; tz = 5.5; }
    else if (lower.includes('bangalore') || lower.includes('bengaluru')) { birthPlace = 'Bengaluru, India'; lat = 12.9716; lon = 77.5946; tz = 5.5; }
    else if (lower.includes('london')) { birthPlace = 'London, UK'; lat = 51.5074; lon = -0.1278; tz = 0.0; }
    else if (lower.includes('new york')) { birthPlace = 'New York, USA'; lat = 40.7128; lon = -74.0060; tz = -5.0; }
    else if (lower.includes('dubai')) { birthPlace = 'Dubai, UAE'; lat = 25.2048; lon = 55.2708; tz = 4.0; }

    return {
      fullName: 'Seeker',
      birthDate,
      birthTime,
      birthPlace,
      latitude: lat,
      longitude: lon,
      timezoneOffset: tz,
      timeConfidence: 'exact' as const,
      consentToSave: true
    };
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      message,
      requestedTemplateId,
      provider = 'auto',
      apiKey,
      model
    } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    // Auto-detect birth details if present
    const naturalBirth = tryExtractBirthDetails(message);
    if (naturalBirth) {
      try {
        saveBirthProfile(naturalBirth);
      } catch (err) {
        console.error('Failed auto-saving natural birth details:', err);
      }
    }

    const currentProfile = getSavedBirthProfile();
    const hasActiveProfile = Boolean(currentProfile && currentProfile.chartData);

    const intentAnalysis = detectIntent(message, hasActiveProfile);
    const intent = requestedTemplateId ? 'REPORT_REQUEST' : intentAnalysis.intent;

    let retrievedContext = '';
    let sources: { docTitle: string; heading: string }[] = [];

    const searchHits = searchKnowledge(message + ' ' + (requestedTemplateId || ''), 2);
    if (searchHits.length > 0) {
      retrievedContext = formatRetrievedContext(searchHits);
      sources = searchHits.map(h => ({ docTitle: h.docTitle, heading: h.heading }));
    }

    const systemPrompt = constructSystemPrompt(
      intent,
      currentProfile?.chartData,
      retrievedContext,
      currentProfile ? {
        fullName: currentProfile.fullName,
        birthDate: currentProfile.birthDate,
        birthTime: currentProfile.birthTime,
        birthPlace: currentProfile.birthPlace
      } : null
    );

    const historyMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    if (conversationId) {
      const conv = getConversation(conversationId);
      if (conv) {
        const recentTurns = conv.messages.slice(-8);
        for (const m of recentTurns) {
          if (m.role === 'user' || m.role === 'assistant') {
            historyMessages.push({ role: m.role, content: m.content });
          }
        }
      }
    }
    historyMessages.push({ role: 'user', content: message });

    if (conversationId) {
      addMessageToConversation(conversationId, { role: 'user', content: message });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'meta',
            intent,
            sources,
            profileAttached: Boolean(currentProfile?.chartData)
          })}\n\n`)
        );

        let fullResponse = '';

        await callAIStreaming(
          {
            provider: provider as AIProvider,
            apiKey,
            model
          },
          systemPrompt,
          historyMessages,
          {
            onChunk(delta) {
              fullResponse += delta;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`));
            },
            onDone(complete) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullText: complete })}\n\n`));
              controller.close();

              if (conversationId) {
                addMessageToConversation(conversationId, {
                  role: 'assistant',
                  content: complete,
                  intent,
                  sources
                });
              }
            },
            onError(err) {
              const errMsg = err?.message || 'Error communicating with assistant.';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
              controller.close();
            }
          },
          req.signal,
          currentProfile?.chartData
        );
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
