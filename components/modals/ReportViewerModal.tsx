'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Printer, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { StoredReport } from '@/lib/db/store.ts';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId?: string;
}

const TEMPLATES = [
  { id: 'transformation_120m', name: 'Master Life Report (Canonical 120m Transformation)', desc: '12 houses, medical astrology, gandanthara timing, milestone ages, dos and don’ts.' },
  { id: 'alternate_120m', name: 'Master Life Report (Alternate 120m Modular)', desc: '8 chapters: personality, education, career, business, marriage, health, wealth.' },
  { id: 'exploration_60m', name: 'Master Life Report (Exploration 60m)', desc: '60-minute deep analysis: yogas, shadbala, past life karma, and runa debts.' },
  { id: 'monthly_report', name: 'Monthly Astrology Intelligence Report', desc: 'Week-by-week decision guidance, risk zones, lucky timings, and financial strategy.' },
  { id: 'introductory_15m', name: 'Introductory Consultation Report (15m)', desc: 'Concise 15-minute birth chart overview and immediate strategic action.' },
  { id: 'personality_15m', name: 'Personality Description (15m)', desc: 'Appearance, physical nature, communication, and psychological tendencies.' },
  { id: 'awareness_30m', name: 'Astrology Life Report (Awareness 30m)', desc: 'Personality, education, career trajectory, marriage dynamics, and progeny.' }
];

export function ReportViewerModal({
  isOpen,
  onClose,
  activeConversationId
}: ReportViewerModalProps) {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('transformation_120m');

  const loadReports = () => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          setReports(data.reports);
          if (data.reports.length > 0 && !selectedReport) {
            setSelectedReport(data.reports[0]);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          conversationId: activeConversationId
        })
      });
      const data = await res.json();
      if (data.report) {
        setReports(prev => [data.report, ...prev]);
        setSelectedReport(data.report);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Error generating report: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '960px', height: '90vh' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--gold-light)" />
            <h2>Personalized Astrology Reports Library</h2>
          </div>
          <button type="button" className="bubble-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left panel: Templates & History */}
          <div style={{ width: '320px', borderRight: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div>
              <div className="sidebar-section-title" style={{ paddingLeft: 0 }}>Create New Report</div>
              <div className="form-group" style={{ marginTop: '6px' }}>
                <select
                  className="form-select"
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={generating}
                style={{ width: '100%', marginTop: '10px', fontSize: '0.84rem' }}
                id="generate-report-btn"
              >
                {generating ? 'Generating Report...' : '+ Generate Report'}
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
              <div className="sidebar-section-title" style={{ paddingLeft: 0 }}>Generated Reports ({reports.length})</div>
              {reports.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No reports generated yet. Click above to generate from your birth chart.
                </div>
              ) : (
                reports.map(r => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: isSelected ? '1px solid var(--gold-border)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)' }}>
                          {r.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(r.id, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()} • {r.nativeName}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Report Viewer */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} id="printable-report-content">
            {selectedReport ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="bubble-action-btn"
                    onClick={handlePrint}
                    style={{ background: 'var(--bg-surface)', padding: '6px 12px', border: '1px solid var(--border-subtle)' }}
                    id="print-pdf-report-btn"
                  >
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                </div>

                <div
                  className="glass-panel"
                  style={{
                    padding: '30px',
                    backgroundColor: 'rgba(19, 30, 56, 0.4)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    fontSize: '0.94rem'
                  }}
                >
                  {selectedReport.contentMarkdown.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} style={{ color: 'var(--gold-light)', fontSize: '1.6rem', marginBottom: '10px' }}>{line.replace('# ', '')}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} style={{ color: 'var(--gold-light)', fontSize: '1.25rem', marginTop: '22px', marginBottom: '8px' }}>{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} style={{ color: 'var(--accent-blue)', fontSize: '1.05rem', marginTop: '16px', marginBottom: '6px' }}>{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px' }}>{line.substring(2)}</li>;
                    }
                    if (line.trim() === '---') {
                      return <hr key={idx} style={{ borderColor: 'var(--border-subtle)', margin: '18px 0' }} />;
                    }
                    if (!line.trim()) {
                      return <div key={idx} style={{ height: '6px' }} />;
                    }
                    return <p key={idx} style={{ marginBottom: '8px' }}>{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
                <FileText size={40} style={{ opacity: 0.4 }} />
                <span>Select a report from the left or generate a new one.</span>
              </div>
            )}
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
