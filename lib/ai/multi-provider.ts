import Anthropic from '@anthropic-ai/sdk';
import { type VedicChartData } from '../astrology/chart-provider.ts';

export type AIProvider = 'claude' | 'gemini' | 'openai' | 'auto';

export interface ProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: any) => void;
}

export function detectProviderFromKey(key: string): 'gemini' | 'claude' | 'openai' {
  const trimmed = key.trim();
  if (trimmed.startsWith('AIzaSy')) return 'gemini';
  if (trimmed.startsWith('sk-ant-')) return 'claude';
  if (trimmed.startsWith('sk-')) return 'openai';
  return 'gemini'; // default modern choice
}

export async function callAIStreaming(
  config: ProviderConfig,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  chartData?: VedicChartData | null
): Promise<void> {
  // Determine active provider & key (prioritize passed config, fallback to env)
  let activeProvider = config.provider;
  let activeKey = config.apiKey?.trim();

  if (!activeKey) {
    if (process.env.GEMINI_API_KEY) {
      activeKey = process.env.GEMINI_API_KEY;
      if (activeProvider === 'auto') activeProvider = 'gemini';
    } else if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      activeKey = process.env.ANTHROPIC_API_KEY;
      if (activeProvider === 'auto') activeProvider = 'claude';
    } else if (process.env.OPENAI_API_KEY) {
      activeKey = process.env.OPENAI_API_KEY;
      if (activeProvider === 'auto') activeProvider = 'openai';
    }
  }

  if (activeKey && activeProvider === 'auto') {
    activeProvider = detectProviderFromKey(activeKey);
  }

  // 1. Google Gemini
  if (activeKey && activeProvider === 'gemini') {
    try {
      await streamGemini(activeKey, config.model || 'gemini-1.5-flash', systemPrompt, messages, callbacks, signal);
      return;
    } catch (err: any) {
      console.warn('Gemini stream error, falling back:', err.message);
    }
  }

  // 2. Anthropic Claude
  if (activeKey && activeProvider === 'claude') {
    try {
      await streamClaude(activeKey, config.model || process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219', systemPrompt, messages, callbacks, signal);
      return;
    } catch (err: any) {
      console.warn('Claude stream error, falling back:', err.message);
    }
  }

  // 3. OpenAI
  if (activeKey && activeProvider === 'openai') {
    try {
      await streamOpenAI(activeKey, config.model || 'gpt-4o-mini', systemPrompt, messages, callbacks, signal);
      return;
    } catch (err: any) {
      console.warn('OpenAI stream error, falling back:', err.message);
    }
  }

  // 4. Built-in Dynamic Astrologer Engine (Zero-configuration fallback)
  const { generatePersonalAstrologerResponse } = await import('./astrologer-engine.ts');
  await generatePersonalAstrologerResponse(messages, callbacks, signal, chartData);
}

// Gemini Streaming Handler
async function streamGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Format messages for Gemini API
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  if (!response.body) throw new Error('No body returned from Gemini.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullAccumulated = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.replace('data: ', '').trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkText) {
            fullAccumulated += chunkText;
            callbacks.onChunk(chunkText);
          }
        } catch (e) {
          // ignore partial json
        }
      }
    }
  }

  callbacks.onDone(fullAccumulated);
}

// Claude Streaming Handler
async function streamClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const client = new Anthropic({ apiKey });
  const stream = await client.messages.stream(
    {
      model,
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
}

// OpenAI Streaming Handler
async function streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const formattedMsgs = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMsgs,
      stream: true,
      temperature: 0.7
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  if (!response.body) throw new Error('No body returned from OpenAI.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullAccumulated = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.choices?.[0]?.delta?.content;
          if (chunkText) {
            fullAccumulated += chunkText;
            callbacks.onChunk(chunkText);
          }
        } catch (e) {
          // partial json
        }
      }
    }
  }

  callbacks.onDone(fullAccumulated);
}
