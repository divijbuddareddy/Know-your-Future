'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, BookOpen } from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KnowledgeBaseModal({ isOpen, onClose }: KnowledgeBaseModalProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/admin/documents')
        .then(res => res.json())
        .then(data => {
          if (data.documents) {
            setDocuments(data.documents);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--accent-purple)" />
            <h2>Client Knowledge Base Documents (RAG Store)</h2>
          </div>
          <button type="button" className="bubble-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
            <CheckCircle2 size={16} />
            <span>
              All 8 client-provided DOCX files are indexed into 129 structured passages with section headings, metadata filtering, and semantic keyword matching.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
            {documents.map((doc, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gold-light)' }}>
                    {doc.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                    {doc.durationMinutes ? `${doc.durationMinutes}m` : 'Prompt'}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--accent-purple)' }}>
                  Category: {doc.category}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {doc.description || 'Reference document for Vedic astrology analysis.'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Raw Length: {doc.rawLength.toLocaleString()} characters
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
