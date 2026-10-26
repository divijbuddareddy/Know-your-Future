'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

export function MessageComposer({
  onSendMessage,
  isLoading,
  onStopGeneration
}: MessageComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="composer-wrapper">
      <div className="composer-box" id="message-composer-box">
        <textarea
          ref={textareaRef}
          id="chat-message-input"
          aria-label="Ask a question or enter birth details"
          className="composer-textarea"
          rows={1}
          placeholder="Ask astrology questions, request a report, or ask general assistant tasks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="composer-controls">
          <div className="composer-hint">
            Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px' }}>Enter</kbd> to send, <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px' }}>Shift + Enter</kbd> for newline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLoading && onStopGeneration && (
              <button
                type="button"
                className="stop-btn"
                onClick={onStopGeneration}
                title="Stop generation"
                id="stop-generation-button"
              >
                <Square size={13} fill="currentColor" /> Stop
              </button>
            )}
            <button
              type="button"
              id="send-message-button"
              aria-label="Send message"
              className="send-btn"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
