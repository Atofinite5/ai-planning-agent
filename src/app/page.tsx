'use client';

import { useState } from 'react';
import { useAgentPipeline } from '@/hooks/useAgentPipeline';
import { useTheme } from '@/hooks/useTheme';
import AgentProgress from '@/components/AgentProgress';
import ReportSectionComponent from '@/components/ReportSection';
import ExportButtons from '@/components/ExportButtons';

const EXAMPLE_PROBLEMS = [
  'Build a creator marketplace platform',
  'Design an AI-powered customer support system',
  'Create a healthcare appointment scheduling app',
  'Build a real-time collaborative document editor',
];

export default function Home() {
  const [problemStatement, setProblemStatement] = useState('');
  const { theme, toggleTheme, mounted } = useTheme();
  const { steps, report, isGenerating, streamingText, currentAgent, generate, editSection, restoreVersion } =
    useAgentPipeline();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen relative">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 navbar-blur">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left — Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-glow" style={{ background: 'var(--accent)', boxShadow: '0 0 24px var(--accent-glow-strong)' }}>
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold gradient-text leading-tight">AI Planning Agent</h1>
                <p className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: 'var(--muted-light)' }}>Multi-Agent System</p>
              </div>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
              {report && <ExportButtons report={report} />}

              {report && (
                <button
                  onClick={() => { setProblemStatement(''); window.location.reload(); }}
                  className="px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    background: 'var(--accent-glow)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                  }}
                >
                  + New
                </button>
              )}

              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg navbar-icon-btn flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <svg className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Bottom glow line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)', opacity: 0.3 }} />
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* ═══ INPUT SECTION ═══ */}
        {!report && !isGenerating && (
          <div className="animate-fade-in">
            <div className="text-center mb-14 pt-12">
              {/* Floating badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 glass glow-border animate-float">
                <span className="w-2 h-2 rounded-full glow-dot" style={{ background: 'var(--accent)' }} />
                <span className="gradient-text">Powered by 3 AI Agents</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight" style={{ color: 'var(--foreground)' }}>
                What problem are<br />
                <span className="gradient-text">you solving?</span>
              </h2>
              <p className="text-base md:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
                Describe your challenge and our AI agents will analyze, enrich, and craft a professional execution plan.
              </p>
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-10">
              <div className="relative rounded-2xl glow-border overflow-hidden">
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && problemStatement.trim() && !isGenerating) {
                      e.preventDefault();
                      generate(problemStatement.trim());
                    } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                      e.stopPropagation();
                    }
                  }}
                  placeholder="Describe your problem or project idea... (⌘ + Enter to submit)"
                  className="w-full p-5 pr-16 text-base focus:outline-none resize-none placeholder:opacity-40"
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--foreground)',
                    border: 'none',
                    backdropFilter: 'blur(12px)',
                  }}
                  rows={4}
                />
                <button
                  type="button"
                  onClick={() => { if (problemStatement.trim() && !isGenerating) generate(problemStatement.trim()); }}
                  disabled={!problemStatement.trim() || isGenerating}
                  className="absolute right-3 bottom-3 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    boxShadow: problemStatement.trim() ? '0 0 20px var(--accent-glow-strong)' : 'none',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Examples */}
            <div className="max-w-3xl mx-auto">
              <p className="text-[11px] mb-3 text-center uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--muted-light)' }}>Try an example</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_PROBLEMS.map((example) => (
                  <button
                    key={example}
                    onClick={() => setProblemStatement(example)}
                    className="px-4 py-2 rounded-xl text-sm glass transition-all hover:scale-[1.03]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                  title: 'Multi-Agent System',
                  desc: 'Three specialized AI agents work in sequence — Planner, Insight, and Execution.',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
                  title: 'AI-Powered Editing',
                  desc: 'Edit any section with natural language. Full version history with instant restore.',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                  title: 'Export Anywhere',
                  desc: 'Download as professionally formatted DOCX or PDF with one click.',
                },
              ].map((feature) => (
                <div key={feature.title} className="p-6 rounded-2xl glass transition-all hover:scale-[1.02] group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
                  </div>
                  <h3 className="font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ GENERATING ═══ */}
        {(isGenerating || steps.length > 0) && !report && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                <span className="gradient-text">Generating</span> your plan...
              </h2>
              <p className="mt-1" style={{ color: 'var(--muted)' }}>&ldquo;{problemStatement}&rdquo;</p>
            </div>
            <AgentProgress steps={steps} streamingText={streamingText} currentAgent={currentAgent} />
          </div>
        )}

        {/* ═══ REPORT ═══ */}
        {report && (
          <div className="animate-slide-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                <span className="gradient-text">Your Execution Plan</span>
              </h2>
              <p className="mt-1" style={{ color: 'var(--muted)' }}>&ldquo;{report.problemStatement}&rdquo;</p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted-light)' }}>
                Generated {new Date(report.createdAt).toLocaleString()} &bull; Last updated{' '}
                {new Date(report.updatedAt).toLocaleString()}
              </p>
            </div>

            {steps.some((s) => s.reasoning) && (
              <AgentProgress steps={steps} streamingText="" currentAgent="" />
            )}

            <div className="space-y-6">
              {report.sections.map((section) => (
                <ReportSectionComponent key={section.id} section={section} onEdit={editSection} onRestoreVersion={restoreVersion} />
              ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl glass glow-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Ready to export?</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Download as a professional document.</p>
              </div>
              <ExportButtons report={report} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-6 relative z-10" style={{ borderTop: '1px solid var(--card-border)' }}>
        <div className="max-w-6xl mx-auto px-6 text-center text-xs tracking-wide" style={{ color: 'var(--muted-light)' }}>
          Built with Next.js &bull; Groq AI &bull; Multi-Agent Architecture
        </div>
      </footer>
    </div>
  );
}
