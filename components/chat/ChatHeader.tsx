'use client';

import React, { useState } from 'react';
import { Sparkles, Trash2, Edit2, Check, Menu } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  onDeleteConversation: () => void;
  onToggleSidebar?: () => void;
}

export function ChatHeader({
  title,
  onUpdateTitle,
  onDeleteConversation,
  onToggleSidebar
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleSaveTitle = () => {
    if (newTitle.trim()) {
      onUpdateTitle(newTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="chat-header">
      <div className="chat-header-title">
        {onToggleSidebar && (
          <button
            type="button"
            className="bubble-action-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
            id="mobile-sidebar-toggle"
          >
            <Menu size={18} />
          </button>
        )}

        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '0.88rem' }}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
            />
            <button
              type="button"
              className="bubble-action-btn"
              onClick={handleSaveTitle}
              title="Save title"
            >
              <Check size={14} color="#34D399" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span id="chat-conversation-title" style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            <button
              type="button"
              className="bubble-action-btn"
              onClick={() => {
                setNewTitle(title);
                setIsEditing(true);
              }}
              title="Rename conversation"
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}

        <div className="pill-badge" id="chat-model-badge">
          Claude 3.7 • Ephemeris Active
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="bubble-action-btn"
          onClick={onDeleteConversation}
          title="Delete current consultation"
          id="delete-conversation-btn"
        >
          <Trash2 size={15} color="#F87171" />
        </button>
      </div>
    </header>
  );
}
