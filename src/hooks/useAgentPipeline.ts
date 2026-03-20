'use client';

import { useState, useCallback } from 'react';
import { AgentStep, Report, ReportSection } from '@/types';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

async function readSSEStream(
  response: Response,
  onContent: (data: string) => void,
  onDone: (data: unknown) => void
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content') {
            onContent(parsed.data);
          } else if (parsed.type === 'done') {
            onDone(parsed.data);
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

export function useAgentPipeline() {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentAgent, setCurrentAgent] = useState<string>('');

  const updateStep = useCallback(
    (agent: string, updates: Partial<AgentStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.agent === agent ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const generate = useCallback(
    async (problemStatement: string) => {
      setIsGenerating(true);
      setReport(null);
      setStreamingText('');

      const initialSteps: AgentStep[] = [
        { agent: 'planner', label: 'Planner Agent', status: 'pending' },
        { agent: 'insight', label: 'Insight Agent', status: 'pending' },
        { agent: 'execution', label: 'Execution Agent', status: 'pending' },
      ];
      setSteps(initialSteps);

      try {
        // Step 1: Planner Agent
        setCurrentAgent('planner');
        updateStep('planner', { status: 'running', startedAt: Date.now() });
        setStreamingText('');

        let plannerOutput: Record<string, unknown> = {};
        const plannerRes = await fetch('/api/agents/planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemStatement }),
        });

        if (!plannerRes.ok) throw new Error('Planner failed');

        await readSSEStream(
          plannerRes,
          (data) => setStreamingText((prev) => prev + data),
          (data) => {
            plannerOutput = data as Record<string, unknown>;
          }
        );

        updateStep('planner', {
          status: 'completed',
          completedAt: Date.now(),
          reasoning: (plannerOutput as Record<string, string>).reasoning || '',
        });

        // Step 2: Insight Agent
        setCurrentAgent('insight');
        updateStep('insight', { status: 'running', startedAt: Date.now() });
        setStreamingText('');

        let insightOutput: Record<string, unknown> = {};
        const insightRes = await fetch('/api/agents/insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemStatement, plannerOutput }),
        });

        if (!insightRes.ok) throw new Error('Insight agent failed');

        await readSSEStream(
          insightRes,
          (data) => setStreamingText((prev) => prev + data),
          (data) => {
            insightOutput = data as Record<string, unknown>;
          }
        );

        updateStep('insight', {
          status: 'completed',
          completedAt: Date.now(),
          reasoning: (insightOutput as Record<string, string>).reasoning || '',
        });

        // Step 3: Execution Agent
        setCurrentAgent('execution');
        updateStep('execution', { status: 'running', startedAt: Date.now() });
        setStreamingText('');

        let executionOutput: Record<string, unknown> = {};
        const executionRes = await fetch('/api/agents/execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemStatement, plannerOutput, insightOutput }),
        });

        if (!executionRes.ok) throw new Error('Execution agent failed');

        await readSSEStream(
          executionRes,
          (data) => setStreamingText((prev) => prev + data),
          (data) => {
            executionOutput = data as Record<string, unknown>;
          }
        );

        updateStep('execution', {
          status: 'completed',
          completedAt: Date.now(),
          reasoning: (executionOutput as Record<string, string>).reasoning || '',
        });

        // Build report from execution output
        const sections = (executionOutput as { sections?: Record<string, string> }).sections || {};
        const now = Date.now();

        const reportSections: ReportSection[] = [
          {
            id: generateId(),
            title: 'Problem Breakdown',
            content: sections.problemBreakdown || '',
            versions: [{ content: sections.problemBreakdown || '', timestamp: now }],
            currentVersionIndex: 0,
          },
          {
            id: generateId(),
            title: 'Stakeholders',
            content: sections.stakeholders || '',
            versions: [{ content: sections.stakeholders || '', timestamp: now }],
            currentVersionIndex: 0,
          },
          {
            id: generateId(),
            title: 'Solution Approach',
            content: sections.solutionApproach || '',
            versions: [{ content: sections.solutionApproach || '', timestamp: now }],
            currentVersionIndex: 0,
          },
          {
            id: generateId(),
            title: 'Action Plan',
            content: sections.actionPlan || '',
            versions: [{ content: sections.actionPlan || '', timestamp: now }],
            currentVersionIndex: 0,
          },
        ];

        const newReport: Report = {
          id: generateId(),
          problemStatement,
          sections: reportSections,
          createdAt: now,
          updatedAt: now,
        };

        setReport(newReport);
        setStreamingText('');
        setCurrentAgent('');
      } catch (error) {
        console.error('Pipeline error:', error);
        const failedAgent = steps.find((s) => s.status === 'running')?.agent || 'planner';
        updateStep(failedAgent, { status: 'error' });
      } finally {
        setIsGenerating(false);
      }
    },
    [steps, updateStep]
  );

  const editSection = useCallback(
    async (sectionId: string, instruction: string) => {
      if (!report) return;

      const section = report.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const res = await fetch('/api/edit-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle: section.title,
          sectionContent: section.content,
          instruction,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Edit failed' }));
        throw new Error(err.error || 'Edit failed');
      }

      let newContent = '';
      await readSSEStream(
        res,
        (data) => {
          newContent += data;
        },
        () => {}
      );

      const newVersion = {
        content: newContent,
        timestamp: Date.now(),
        editInstruction: instruction,
      };

      setReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          updatedAt: Date.now(),
          sections: prev.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  content: newContent,
                  versions: [...s.versions, newVersion],
                  currentVersionIndex: s.versions.length,
                }
              : s
          ),
        };
      });

      return newContent;
    },
    [report]
  );

  const restoreVersion = useCallback(
    (sectionId: string, versionIndex: number) => {
      setReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          updatedAt: Date.now(),
          sections: prev.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  content: s.versions[versionIndex].content,
                  currentVersionIndex: versionIndex,
                }
              : s
          ),
        };
      });
    },
    []
  );

  return {
    steps,
    report,
    isGenerating,
    streamingText,
    currentAgent,
    generate,
    editSection,
    restoreVersion,
  };
}
