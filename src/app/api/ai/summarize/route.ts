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
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an email assistant. Summarize emails in 2-3 concise sentences. Mention any action items.'
                },
                {
                    role: 'user',
                    content: `Summarize this email:\n\nSubject: ${subject || 'No Subject'}\n\n${emailBody}`
                },
            ],
            // Removed response_format: { type: "json_object" } to allow free text
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
