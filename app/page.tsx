'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Key,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Moon
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 100% Astrology-Focused Quick Starters
const ASTROLOGY_STARTERS = [
  {
    label: '🌟 Birth Chart',
    prompt: 'Please read my Vedic birth chart (Janma Kundli). What are my Ascendant (Lagna), Moon sign (Rashi), and key planetary placements?'
  },
  {
    label: '💼 Career',
    prompt: 'Analyze my career path, optimal professions, business opportunities, and timing for professional growth according to my chart.'
  },
  {
    label: '💖 Marriage & Love',
    prompt: 'What do my 7th house and Venus/Jupiter placements reveal about marriage timing, spouse nature, and relationship harmony?'
  },
  {
    label: '🪙 Wealth & Finance',
    prompt: 'What does my chart indicate regarding wealth accumulation, financial stability, and fortunate earning windows?'
  },
  {
    label: '🪐 Current Dasha',
    prompt: 'What is my active Vimshottari Mahadasha and Antardasha phase, and what timing themes does this planetary cycle govern?'
  },
  {
    label: '📜 Master Life Report',
    prompt: 'Please generate a comprehensive Vedic Master Life Report with an in-depth life roadmap, planetary analysis, and guidance.'
  },
  {
    label: '🌙 Today’s Transits',
    prompt: 'What are today’s key planetary transits, Moon placement, and Panchanga indicators for my day?'
  },
  {
    label: '🛡️ Doshas & Remedies',
    prompt: 'Check my astrological placements for any significant doshas, Saturn Sade Sati influence, and recommend supportive Vedic remedies.'
  }
];

export default function PersonalAstrologerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // API Key Settings State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'claude' | 'openai'>('auto');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKeyNotification, setSavedKeyNotification] = useState(false);

  const chatStreamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('astrologer_user_api_key');
      const storedProvider = localStorage.getItem('astrologer_user_provider') as any;
      if (storedKey) setApiKey(storedKey);
      if (storedProvider) setProvider(storedProvider);
    } catch (e) {
      console.error(e);
    }

    const initialGreeting: ChatMessage = {
      id: 'greeting',
      role: 'assistant',
      content: `🙏 **Namaste! I am AstroVinodAI, your Vedic Astrologer.**\n\nShare your **Date, Time, and City of Birth** (or select a reading below) to begin.`
    };
    setMessages([initialGreeting]);
  }, []);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (apiKey.trim()) {
        localStorage.setItem('astrologer_user_api_key', apiKey.trim());
        localStorage.setItem('astrologer_user_provider', provider);
      } else {
        localStorage.removeItem('astrologer_user_api_key');
        localStorage.removeItem('astrologer_user_provider');
      }
      setSavedKeyNotification(true);
      setTimeout(() => {
        setSavedKeyNotification(false);
        setIsKeyModalOpen(false);
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('astrologer_user_api_key');
    localStorage.removeItem('astrologer_user_provider');
    setApiKey('');
    setProvider('auto');
    setIsKeyModalOpen(false);
  };

  const handleNewReading = () => {
    if (isLoading) handleStop();
    setMessages([
      {
        id: 'new-reading-' + Date.now(),
        role: 'assistant',
        content: `✨ **A new astrological consultation begins.**\n\nShare your birth details or ask about any planetary placement, transit, or life question.`
      }
    ]);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const assistantId = 'asst-' + Date.now();
    let currentAssistantText = '';

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          provider,
          apiKey: apiKey.trim() || undefined
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error('No readable stream available.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' }
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));

              if (data.chunk) {
                currentAssistantText += data.chunk;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: currentAssistantText } : m
                  )
                );
              }

              if (data.done && data.fullText) {
                currentAssistantText = data.fullText;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: currentAssistantText } : m
                  )
                );
              }

              if (data.error) {
                currentAssistantText += `\n\n*(Error: ${data.error})*`;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: currentAssistantText } : m
                  )
                );
              }
            } catch (e) {
              // partial chunk
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setMessages(prev => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: 'I apologize, an unexpected disturbance interrupted our reading. Please ask again.'
          }
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx}>
            {parseInlineStyling(line.substring(2))}
          </li>
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} style={{ borderColor: 'var(--border-subtle)', margin: '14px 0' }} />;
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return <p key={idx}>{parseInlineStyling(line)}</p>;
    });
  };

  const parseInlineStyling = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} style={{ color: 'var(--text-muted)' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="chat-sanctum">
      {/* Top Astrologer Header */}
      <header className="astrologer-header">
        <div className="astrologer-identity">
          <div className="celestial-orb" title="Astro Vinod">
            <img
              src="/astro-vinod-face.png"
              alt="Astro Vinod"
              className="astrologer-avatar-img"
            />
          </div>
          <div className="astrologer-names">
            <div className="astrologer-title">
              AstroVinodAI
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-btn"
            onClick={() => setIsKeyModalOpen(true)}
            title="Configure Claude, Gemini, or OpenAI API key"
            id="api-key-btn"
          >
            <Key size={14} color="var(--gold-glow)" />
            <span>{apiKey ? 'API Key Active' : 'Enter API Key'}</span>
          </button>

          <button
            type="button"
            className="header-btn"
            onClick={handleNewReading}
            title="Start a fresh reading"
            id="new-reading-btn"
          >
            <RotateCcw size={14} /> New Consultation
          </button>
        </div>
      </header>

      {/* Main Chat Stream */}
      <div className="chat-stream" ref={chatStreamRef} id="chat-messages-stream">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`chat-row ${isUser ? 'user-row' : 'assistant-row'}`}
              id={`chat-row-${index}`}
            >
              {!isUser && (
                <div className="message-avatar astrologer" title="AstroVinodAI">
                  <img
                    src="/astro-vinod-face.png"
                    alt="Astro Vinod"
                    className="astrologer-avatar-img"
                  />
                </div>
              )}

              <div className="chat-bubble">
                {renderFormattedMarkdown(msg.content)}

                {!isUser && (
                  <div>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy reading"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} color="#34D399" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Reading
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="message-avatar user" title="Seeker">
                  Seeker
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="chat-row assistant-row">
            <div className="message-avatar astrologer" title="AstroVinodAI">
              <img
                src="/astro-vinod-face.png"
                alt="Astro Vinod"
                className="astrologer-avatar-img"
              />
            </div>
            <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-glow)' }}>
              <span>Aligning planetary degrees and reading your stars...</span>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-primary)', animation: 'pulse-ring 1s infinite' }} />
            </div>
          </div>
        )}
      </div>

      {/* 100% Astrology Quick Topic Starters */}
      <div className="topic-chips" id="quick-starters">
        {ASTROLOGY_STARTERS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSendMessage(s.prompt)}
            disabled={isLoading}
            id={`starter-chip-${idx}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bottom Composer */}
      <div className="chat-composer-bar">
        <div className="composer-card" id="chat-composer-card">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="composer-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          <div className="composer-bottom" style={{ justifyContent: 'flex-end' }}>
            <div className="composer-actions">
              {isLoading && (
                <button
                  type="button"
                  className="stop-reading-btn"
                  onClick={handleStop}
                  title="Pause reading"
                  id="stop-reading-button"
                >
                  <Square size={12} fill="currentColor" /> Stop
                </button>
              )}

              <button
                type="button"
                className="send-orb-btn"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                title="Send astrological query"
                id="send-button"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsKeyModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--gold-glow)" />
                <h3>Connect Your AI API Key</h3>
              </div>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setIsKeyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">AI Model Provider</label>
                  <select
                    className="form-select"
                    value={provider}
                    onChange={e => setProvider(e.target.value as any)}
                  >
                    <option value="auto">✨ Auto-Detect (Gemini, Claude, or OpenAI)</option>
                    <option value="gemini">🌟 Google Gemini</option>
                    <option value="claude">🪐 Anthropic Claude</option>
                    <option value="openai">🤖 OpenAI</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingRight: '44px' }}
                      placeholder="Paste your API key here..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {savedKeyNotification && (
                  <div style={{
                    background: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#34D399',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500
                  }}>
                    <CheckCircle2 size={17} /> API Key successfully saved!
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#F87171', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', marginRight: 'auto' }}
                  >
                    Remove Key
                  </button>
                ) : null}

                <button type="button" className="btn-secondary" onClick={() => setIsKeyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" id="save-api-key-btn">
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
