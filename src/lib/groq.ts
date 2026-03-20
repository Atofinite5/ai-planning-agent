import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;

export async function streamGroqCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'llama-3.3-70b-versatile'
) {
  const stream = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  });

  return stream;
}

export async function groqCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'llama-3.3-70b-versatile'
) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || '';
}
