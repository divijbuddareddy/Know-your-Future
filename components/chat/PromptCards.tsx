'use client';

import React from 'react';
import { Sparkles, FileText, HelpCircle, Mail, Cpu } from 'lucide-react';

interface PromptCardsProps {
  onSelectPrompt: (promptText: string) => void;
}

export function PromptCards({ onSelectPrompt }: PromptCardsProps) {
  const prompts = [
    {
      title: 'Explain my birth chart',
      description: 'Analyze your ascendant, planetary placements, and active dasha period.',
      icon: Sparkles,
      text: 'Please analyze my birth chart, explain my ascendant (lagna), key planetary placements, and my current dasha phase.'
    },
    {
      title: 'Generate Master Life Report',
      description: 'Create a canonical 120-minute transformation biographical reading.',
      icon: FileText,
      text: 'Please generate a comprehensive Master Life Report using the 120-minute canonical transformation template.'
    },
    {
      title: 'What details are needed for Vedic reading?',
      description: 'Understand required birth inputs, ayanamsa, and time precision.',
      icon: HelpCircle,
      text: 'What exact details do you need to calculate an accurate Vedic birth chart, and why is birth time precision important?'
    },
    {
      title: 'Help me write a professional email',
      description: 'Draft, refine, or proofread business communications cleanly.',
      icon: Mail,
      text: 'Can you help me write a concise, persuasive email to a client proposing a strategic project timeline?'
    },
    {
      title: 'Explain how RAG works in simple terms',
      description: 'Explore the mechanics of retrieval-augmented generation.',
      icon: Cpu,
      text: 'Explain how Retrieval-Augmented Generation (RAG) works in simple terms, and why it is better than fine-tuning for dynamic documents.'
    }
  ];

  return (
    <div className="prompt-cards-grid" id="suggested-prompt-cards">
      {prompts.map((p, idx) => {
        const Icon = p.icon;
        return (
          <div
            key={idx}
            className="prompt-card"
            onClick={() => onSelectPrompt(p.text)}
            role="button"
            tabIndex={0}
            id={`prompt-card-${idx}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Icon size={16} color="var(--gold-light)" />
              <div className="prompt-card-title">{p.title}</div>
            </div>
            <div className="prompt-card-desc">{p.description}</div>
          </div>
        );
      })}
    </div>
  );
}
