'use client';

import { ReportSection as ReportSectionType } from '@/types';
import { useState } from 'react';

interface ReportSectionProps {
  section: ReportSectionType;
  onEdit: (sectionId: string, instruction: string) => Promise<string | undefined>;
  onRestoreVersion: (sectionId: string, versionIndex: number) => void;
}

function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:600;color:var(--foreground);margin-top:1rem;margin-bottom:0.5rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.25rem;font-weight:700;color:var(--foreground);margin-top:1.25rem;margin-bottom:0.75rem">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--foreground)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[\-\*] (.+)$/gm, '<li style="margin-left:1rem;margin-bottom:0.25rem;color:var(--muted)">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1rem;margin-bottom:0.25rem;color:var(--muted);list-style-type:decimal">$1</li>')
    .replace(/\n\n/g, '</p><p style="color:var(--muted);margin-bottom:0.75rem;line-height:1.7">')
    .replace(/\n/g, '<br/>');

  html = '<p style="color:var(--muted);margin-bottom:0.75rem;line-height:1.7">' + html + '</p>';
  return html;
}

const QUICK_EDITS = [
  { label: 'More Detailed', instruction: 'Make this section significantly more detailed with deeper analysis and specific examples' },
  { label: 'Professional Tone', instruction: 'Rewrite in a more professional, consulting-grade tone' },
  { label: 'Shorten', instruction: 'Shorten this section to be more concise while keeping key points' },
  { label: 'Add Examples', instruction: 'Add concrete, real-world examples to illustrate the points' },
];

export default function ReportSectionComponent({ section, onEdit, onRestoreVersion }: ReportSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const handleEdit = async (instruction: string) => {
    setIsProcessing(true);
    try {
      await onEdit(section.id, instruction);
      setEditInstruction('');
      setIsEditing(false);
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSectionIcon = (title: string) => {
    switch (title) {
      case 'Problem Breakdown':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'Stakeholders':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'Solution Approach':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'Action Plan':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all glass">
      {/* Section Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(0, 196, 204, 0.06) 100%)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <div className="flex items-center gap-3" style={{ color: 'var(--accent)' }}>
          {getSectionIcon(section.title)}
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{section.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {section.versions.length > 1 && (
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all glass"
              style={{ color: 'var(--muted)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {section.versions.length} versions
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium"
            style={{
              background: 'var(--accent-glow)',
              color: 'var(--accent)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            AI Edit
          </button>
        </div>
      </div>

      {/* Version History */}
      {showVersions && section.versions.length > 1 && (
        <div className="px-6 py-3" style={{ background: 'var(--section-bg)', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Version History</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {section.versions.map((version, idx) => (
              <button
                key={idx}
                onClick={() => onRestoreVersion(section.id, idx)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: idx === section.currentVersionIndex ? 'var(--accent)' : 'var(--card)',
                  color: idx === section.currentVersionIndex ? '#000' : 'var(--muted)',
                  border: idx === section.currentVersionIndex ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                  fontWeight: idx === section.currentVersionIndex ? 600 : 400,
                  boxShadow: idx === section.currentVersionIndex ? '0 0 12px var(--accent-glow-strong)' : 'none',
                }}
              >
                v{idx + 1}
                {version.editInstruction && (
                  <span style={{ marginLeft: 4, opacity: 0.7 }}>&mdash; {version.editInstruction.slice(0, 25)}...</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Edit Panel */}
      {isEditing && (
        <div className="px-6 py-4" style={{ background: 'var(--section-bg)', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_EDITS.map((edit) => (
              <button
                key={edit.label}
                onClick={() => handleEdit(edit.instruction)}
                disabled={isProcessing}
                className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 glass hover:scale-[1.03]"
                style={{ color: 'var(--muted)' }}
              >
                {edit.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Custom instruction: e.g., 'Add more technical details'"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none glow-border"
              style={{ background: 'var(--input-bg)', color: 'var(--foreground)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editInstruction.trim()) {
                  handleEdit(editInstruction);
                }
              }}
              disabled={isProcessing}
            />
            <button
              onClick={() => editInstruction.trim() && handleEdit(editInstruction)}
              disabled={isProcessing || !editInstruction.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'var(--accent)',
                color: '#000',
                boxShadow: '0 0 20px var(--accent-glow-strong)',
              }}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Editing...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="px-6 py-5 max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
      />
    </div>
  );
}
