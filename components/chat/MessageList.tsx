'use client';

import React, { useState } from 'react';
import { Sparkles, User, Copy, Check, BookOpen } from 'lucide-react';
import { PromptCards } from './PromptCards';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  intent?: string;
  sources?: { docTitle: string; heading: string }[];
}

interface MessageListProps {
  messages: MessageItem[];
  isLoading: boolean;
  onSelectPrompt: (promptText: string) => void;
  onRequestReportModal?: () => void;
}

export function MessageList({
  messages,
  isLoading,
  onSelectPrompt,
  onRequestReportModal
}: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Basic formatted markdown parser (handles headers, bold, bullet points, italics)
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ marginTop: '14px', marginBottom: '6px', color: 'var(--gold-light)' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ marginTop: '18px', marginBottom: '8px', color: 'var(--gold-light)' }}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--gold-light)' }}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            {parseInlineStyling(content)}
          </li>
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} style={{ borderColor: 'var(--border-subtle)', margin: '14px 0' }} />;
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return <p key={idx} style={{ marginBottom: '8px' }}>{parseInlineStyling(line)}</p>;
    });
  };

  const parseInlineStyling = (text: string) => {
    // Basic regex parser for bold **text** and italic *text*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} style={{ color: 'var(--text-muted)' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')) {
    return (
      <div className="message-list" id="chat-messages-container">
        <div className="welcome-container">
          <div className="brand-icon" style={{ width: 56, height: 56, borderRadius: '16px' }}>
            <Sparkles size={30} />
          </div>
          <h1 className="welcome-title">
            AI Astrologer <span className="gold-text">& Personal Assistant</span>
          </h1>
          <p className="welcome-subtitle">
            Hello. I can help you explore astrology, create a personalized report, or answer everyday questions. What would you like to talk about?
          </p>

          <PromptCards onSelectPrompt={onSelectPrompt} />
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" id="chat-messages-container">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id || index}
            className={`message-row ${isUser ? 'user' : 'assistant'}`}
            id={`message-row-${index}`}
          >
            {!isUser && (
              <div className="avatar assistant-avatar" title="AI Astrologer">
                <Sparkles size={18} />
              </div>
            )}

            <div className="bubble">
              {renderFormattedMarkdown(msg.content)}

              {msg.sources && msg.sources.length > 0 && (
                <div className="source-tags" title="Grounded from client knowledge base">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={12} /> Sources:
                  </div>
                  {msg.sources.map((src, i) => (
                    <span key={i} className="source-tag">
                      {src.docTitle} ({src.heading})
                    </span>
                  ))}
                </div>
              )}

              {!isUser && (
                <div className="bubble-actions">
                  <button
                    type="button"
                    className="bubble-action-btn"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    title="Copy response"
                    id={`copy-btn-${index}`}
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={13} color="#34D399" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy
                      </>
                    )}
                  </button>

                  {onRequestReportModal && msg.content.includes('Report') && (
                    <button
                      type="button"
                      className="bubble-action-btn"
                      onClick={onRequestReportModal}
                      style={{ color: 'var(--gold-light)' }}
                    >
                      <Sparkles size={13} /> View / Export Reports
                    </button>
                  )}
                </div>
              )}
            </div>

            {isUser && (
              <div className="avatar user-avatar" title="You">
                <User size={18} />
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="message-row assistant">
          <div className="avatar assistant-avatar">
            <Sparkles size={18} />
          </div>
          <div className="bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold-light)', fontSize: '0.88rem' }}>Consulting Vedic ephemeris & Claude...</span>
            <span className="pulse-indicator" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-primary)', animation: 'pulse 1.2s infinite' }} />
          </div>
        </div>
      )}
    </div>
  );
}
