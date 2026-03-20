import { NextRequest } from 'next/server';
import { streamGroqCompletion } from '@/lib/groq';
import { EDIT_SECTION_SYSTEM_PROMPT } from '@/lib/agents';

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, sectionContent, instruction } = await req.json();

    if (sectionContent == null || !instruction) {
      return new Response(JSON.stringify({ error: 'Section content and instruction are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Section Title: "${sectionTitle}"

Current Content:
${sectionContent}

User's Editing Instruction: "${instruction}"

Rewrite this section according to the instruction. Return ONLY the rewritten content, no JSON, no explanation.`;

    const stream = await streamGroqCompletion(EDIT_SECTION_SYSTEM_PROMPT, userPrompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', data: content })}\n\n`)
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
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
    console.error('Edit section error:', error);
    return new Response(JSON.stringify({ error: 'Edit failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
