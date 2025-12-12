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
                    content: `You are an email assistant. Summarize emails in EXACTLY 3 bullet points:
- Point 1: What is this email about (one sentence)
- Point 2: Key information or details (one sentence)
- Point 3: Action required or next steps (or "No action required")

Always use bullet points (•). Keep each point under 15 words. Be concise.`
                },
                {
                    role: 'user',
                    content: `Summarize this email:\n\nSubject: ${subject || 'No Subject'}\n\n${emailBody}`
                },
            ],
            max_tokens: 200,
        });

        const summary = response.choices[0].message.content || 'Could not generate summary';
        console.log('✅ Summary generated:', summary);

        // Return simple object with scalar string
        return NextResponse.json({ summary });

    } catch (error) {
        console.error('❌ Summarize error:', error);
        return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
    }
}
