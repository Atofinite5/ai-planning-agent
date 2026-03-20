import { NextRequest } from 'next/server';
import { streamGroqCompletion } from '@/lib/groq';
import { INSIGHT_SYSTEM_PROMPT } from '@/lib/agents';

export async function POST(req: NextRequest) {
  try {
    const { problemStatement, plannerOutput } = await req.json();

    if (!problemStatement || !plannerOutput) {
      return new Response(JSON.stringify({ error: 'Problem statement and planner output are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Original Problem: "${problemStatement}"

Planner Agent's Analysis:
- Components identified: ${plannerOutput.components?.join(', ') || 'N/A'}
- Problem Breakdown: ${plannerOutput.problemBreakdown || 'N/A'}
- Stakeholders: ${plannerOutput.stakeholders?.join(', ') || 'N/A'}
- Planner's Reasoning: ${plannerOutput.reasoning || 'N/A'}

Now enrich this analysis with deeper insights, strategic context, and actionable recommendations.`;

    const stream = await streamGroqCompletion(INSIGHT_SYSTEM_PROMPT, userPrompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_start', agent: 'insight' })}\n\n`)
        );

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', agent: 'insight', data: content })}\n\n`)
            );
          }
        }

        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'insight', data: parsed })}\n\n`)
            );
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'insight', data: { reasoning: fullContent, enrichedBreakdown: fullContent, stakeholderAnalysis: '', contextualInsights: '' } })}\n\n`)
            );
          }
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'insight', data: { reasoning: fullContent, enrichedBreakdown: fullContent, stakeholderAnalysis: '', contextualInsights: '' } })}\n\n`)
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
    console.error('Insight agent error:', error);
    return new Response(JSON.stringify({ error: 'Insight agent failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
