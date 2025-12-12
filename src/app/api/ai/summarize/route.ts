import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('📥 Summarize request body:', JSON.stringify(body));

        const { emailBody, subject } = body;

        if (!emailBody) {
            console.log('❌ No email body provided');
            return NextResponse.json({ error: 'No email body provided' }, { status: 400 });
        }

        const openai = getOpenAIClient();
        console.log('🤖 Calling OpenAI...');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an email assistant. 
1. Summarize emails in EXACTLY 3 bullet points.
2. Categorize the email: "decision" (needs response), "fyi" (informational), "gatekeeper" (automated/newsletter).

Respond in this JSON format:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "category": "decision" | "fyi" | "gatekeeper"
}`
                },
                {
                    role: 'user',
                    content: `Analyze this email:\n\nSubject: ${subject || 'No Subject'}\n\n${emailBody}`
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 200,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const data = JSON.parse(content);
        console.log('✅ Summary & Category generated:', data);

        // Return structured object
        return NextResponse.json(data);

    } catch (error) {
        console.error('❌ Summarize error:', error);
        return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
    }
}
