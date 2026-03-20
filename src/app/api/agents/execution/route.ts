import { NextRequest } from 'next/server';
import { streamGroqCompletion } from '@/lib/groq';
import { EXECUTION_SYSTEM_PROMPT } from '@/lib/agents';

export async function POST(req: NextRequest) {
  try {
    const { problemStatement, plannerOutput, insightOutput } = await req.json();

    if (!problemStatement || !plannerOutput || !insightOutput) {
      return new Response(JSON.stringify({ error: 'All agent outputs are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Original Problem: "${problemStatement}"

=== PLANNER AGENT OUTPUT ===
Components: ${plannerOutput.components?.join(', ') || 'N/A'}
Problem Breakdown: ${plannerOutput.problemBreakdown || 'N/A'}
Stakeholders: ${plannerOutput.stakeholders?.join(', ') || 'N/A'}

=== INSIGHT AGENT OUTPUT ===
Enriched Breakdown: ${insightOutput.enrichedBreakdown || 'N/A'}
Stakeholder Analysis: ${insightOutput.stakeholderAnalysis || 'N/A'}
Contextual Insights: ${insightOutput.contextualInsights || 'N/A'}

Now synthesize all of this into a final, professional structured report with four sections: Problem Breakdown, Stakeholders, Solution Approach, and Action Plan.`;

    const stream = await streamGroqCompletion(EXECUTION_SYSTEM_PROMPT, userPrompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_start', agent: 'execution' })}\n\n`)
        );

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', agent: 'execution', data: content })}\n\n`)
            );
          }
        }

        function buildFallbackSections(text: string) {
          const sectionPatterns = [
            { key: 'problemBreakdown', pattern: /(?:problem\s*breakdown|##\s*1)[:\s]*([\s\S]*?)(?=(?:stakeholder|##\s*2)|$)/i },
            { key: 'stakeholders', pattern: /(?:stakeholder|##\s*2)[s]?[:\s]*([\s\S]*?)(?=(?:solution\s*approach|##\s*3)|$)/i },
            { key: 'solutionApproach', pattern: /(?:solution\s*approach|##\s*3)[:\s]*([\s\S]*?)(?=(?:action\s*plan|##\s*4)|$)/i },
            { key: 'actionPlan', pattern: /(?:action\s*plan|##\s*4)[:\s]*([\s\S]*?)$/i },
          ];
          const sections: Record<string, string> = {
            problemBreakdown: text,
            stakeholders: text,
            solutionApproach: text,
            actionPlan: text,
          };
          for (const { key, pattern } of sectionPatterns) {
            const match = text.match(pattern);
            if (match?.[1]?.trim()) {
              sections[key] = match[1].trim();
            }
          }
          return sections;
        }

        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'execution', data: parsed })}\n\n`)
            );
          } else {
            const sections = buildFallbackSections(fullContent);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'execution', data: { reasoning: fullContent, sections } })}\n\n`)
            );
          }
        } catch {
          const sections = buildFallbackSections(fullContent);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'execution', data: { reasoning: fullContent, sections } })}\n\n`)
          );
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Execution agent error:', error);
    return new Response(JSON.stringify({ error: 'Execution agent failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
