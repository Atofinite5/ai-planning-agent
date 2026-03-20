export interface ReportSection {
  id: string;
  title: string;
  content: string;
  versions: SectionVersion[];
  currentVersionIndex: number;
}

export interface SectionVersion {
  content: string;
  timestamp: number;
  editInstruction?: string;
}

export interface Report {
  id: string;
  problemStatement: string;
  sections: ReportSection[];
  createdAt: number;
  updatedAt: number;
}

export interface AgentStep {
  agent: 'planner' | 'insight' | 'execution';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  reasoning?: string;
  output?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PlannerOutput {
  reasoning: string;
  components: string[];
  problemBreakdown: string;
  stakeholders: string[];
}

export interface InsightOutput {
  reasoning: string;
  enrichedBreakdown: string;
  stakeholderAnalysis: string;
  contextualInsights: string;
}

export interface ExecutionOutput {
  reasoning: string;
  sections: {
    problemBreakdown: string;
    stakeholders: string;
    solutionApproach: string;
    actionPlan: string;
  };
}

export interface StreamChunk {
  type: 'reasoning' | 'content' | 'done' | 'error';
  agent: string;
  data: string;
}
