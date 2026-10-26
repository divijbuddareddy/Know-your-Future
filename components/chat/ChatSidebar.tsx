'use client';

import React from 'react';
import { Sparkles, Plus, MessageSquare, User, FileText, Database, Trash2 } from 'lucide-react';
import { StoredConversation } from '@/lib/db/store.ts';

interface ChatSidebarProps {
  conversations: StoredConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenProfile: () => void;
  onOpenReports: () => void;
  onOpenKnowledgeBase: () => void;
  hasProfile: boolean;
  isOpenMobile: boolean;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenProfile,
  onOpenReports,
  onOpenKnowledgeBase,
  hasProfile,
  isOpenMobile
}: ChatSidebarProps) {
  return (
    <aside className={`sidebar ${isOpenMobile ? 'open' : ''}`} id="main-sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <span>AI Astrologer</span>
        </div>
      </div>

      <button
        type="button"
        className="new-chat-btn"
        onClick={onNewChat}
        id="new-consultation-btn"
      >
        <Plus size={16} /> New Consultation
      </button>

      <div className="sidebar-scroll-area">
        <div className="sidebar-section-title">Recent Consultations</div>
        {conversations.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            No previous chats.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
                id={`conversation-item-${conv.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageSquare size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title}
                  </span>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  onClick={(e) => onDeleteConversation(conv.id, e)}
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-action-btn"
          onClick={onOpenProfile}
          id="open-profile-btn"
        >
          <User size={16} color="var(--gold-light)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Birth Profile & Chart</span>
            <span style={{ fontSize: '0.72rem', color: hasProfile ? '#34D399' : 'var(--text-muted)' }}>
              {hasProfile ? '● Chart Configured' : '○ Not Configured'}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="nav-action-btn"
          onClick={onOpenReports}
          id="open-reports-btn"
        >
          <FileText size={16} color="var(--accent-blue)" />
          <span>Reports & Exports</span>
        </button>

        <button
          type="button"
          className="nav-action-btn"
          onClick={onOpenKnowledgeBase}
          id="open-knowledge-base-btn"
        >
          <Database size={16} color="var(--accent-purple)" />
          <span>Knowledge Base (8 Docs)</span>
        </button>
      </div>
    </aside>
  );
}
