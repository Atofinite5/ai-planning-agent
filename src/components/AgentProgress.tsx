'use client';

import { AgentStep } from '@/types';
import { useState } from 'react';

interface AgentProgressProps {
  steps: AgentStep[];
  streamingText: string;
  currentAgent: string;
}

export default function AgentProgress({ steps, streamingText, currentAgent }: AgentProgressProps) {
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);

  if (steps.length === 0) return null;

  const getStatusIcon = (status: AgentStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-9 h-9 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: 'var(--card-border)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--muted-light)' }} />
          </div>
        );
      case 'running':
        return (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center animate-glow" style={{ border: '2px solid var(--accent)', background: 'var(--accent-glow)' }}>
            <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: 'var(--accent)' }} />
          </div>
        );
      case 'completed':
        return (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', boxShadow: '0 0 15px var(--accent-glow)' }}>
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-9 h-9 rounded-lg bg-red-500/80 flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.3)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getAgentDescription = (agent: string) => {
    switch (agent) {
      case 'planner': return 'Breaking down the problem into components and stakeholders';
      case 'insight': return 'Enriching with strategic context and deeper reasoning';
      case 'execution': return 'Synthesizing into a structured execution report';
      default: return '';
    }
  };

  return (
    <div className="rounded-2xl p-6 mb-8 glass">
      <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Agent Pipeline
      </h3>

      <div className="space-y-5">
        {steps.map((step, idx) => (
          <div key={step.agent} className="relative">
            {idx < steps.length - 1 && (
              <div
                className="absolute left-[18px] top-9 w-px h-full"
                style={{ background: step.status === 'completed' ? 'var(--accent)' : 'var(--card-border)', opacity: step.status === 'completed' ? 0.4 : 1 }}
              />
            )}

            <div className="flex items-start gap-4">
              {getStatusIcon(step.status)}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{step.label}</h4>
                  {step.status === 'running' && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold glow-border" style={{ color: 'var(--accent)', background: 'var(--accent-glow)' }}>
                      Processing...
                    </span>
                  )}
                  {step.status === 'completed' && step.completedAt && step.startedAt && (
                    <span className="text-[11px] font-mono" style={{ color: 'var(--muted-light)' }}>
                      {((step.completedAt - step.startedAt) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{getAgentDescription(step.agent)}</p>

                {step.status === 'completed' && step.reasoning && (
                  <button
                    onClick={() => setExpandedReasoning(expandedReasoning === step.agent ? null : step.agent)}
                    className="mt-2 text-xs flex items-center gap-1 transition-colors font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    <svg className={`w-3 h-3 transition-transform ${expandedReasoning === step.agent ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    View reasoning
                  </button>
                )}

                {expandedReasoning === step.agent && step.reasoning && (
                  <div className="mt-2 p-3 rounded-xl text-xs glass" style={{ color: 'var(--muted)' }}>
                    <p className="whitespace-pre-wrap leading-relaxed">{step.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentAgent && streamingText && (
        <div className="mt-6 p-4 rounded-xl glow-border animate-shimmer">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse glow-dot" style={{ background: 'var(--accent)' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider gradient-text">
              Live &mdash; {currentAgent} agent
            </span>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
            {streamingText.slice(-1000)}
          </pre>
        </div>
      )}
    </div>
  );
}
