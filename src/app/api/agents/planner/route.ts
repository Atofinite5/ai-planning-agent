import { NextRequest } from 'next/server';
import { streamGroqCompletion } from '@/lib/groq';
import { PLANNER_SYSTEM_PROMPT } from '@/lib/agents';

export async function POST(req: NextRequest) {
  try {
    const { problemStatement } = await req.json();

    if (!problemStatement) {
      return new Response(JSON.stringify({ error: 'Problem statement is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Analyze the following problem and break it down into components:\n\n"${problemStatement}"`;

    const stream = await streamGroqCompletion(PLANNER_SYSTEM_PROMPT, userPrompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        // Send reasoning start marker
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_start', agent: 'planner' })}\n\n`)
        );

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', agent: 'planner', data: content })}\n\n`)
            );
          }
        }

        // Parse the full content as JSON
        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'planner', data: parsed })}\n\n`)
            );
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'planner', data: { reasoning: fullContent, components: [], problemBreakdown: fullContent, stakeholders: [] } })}\n\n`)
            );
          }
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', agent: 'planner', data: { reasoning: fullContent, components: [], problemBreakdown: fullContent, stakeholders: [] } })}\n\n`)
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
    console.error('Planner agent error:', error);
    return new Response(JSON.stringify({ error: 'Planner agent failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
