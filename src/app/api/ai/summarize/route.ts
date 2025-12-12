import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const { emailBody, subject } = await req.json();

        if (!emailBody) {
            return NextResponse.json({ error: 'No email body provided' }, { status: 400 });
        }

        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are Sage, an elite executive assistant.
Your Goal: Summarize the provided email thread into 3 distinct, high-value bullet points.

CRITICAL RULES:
1. **Ignore Noise:** If the thread contains automated bank alerts, newsletters, or system notifications (e.g., HDFC, Naukri), IGNORE them completely unless they are the ONLY content.
2. **Focus on Business:** Prioritize invoices, scheduling, and human questions.
3. **Be Specific:** Do not say 'The user sent an email'. Say 'Nikhil sent the invoice'.
4. **Format:** Return valid JSON: { summary: ['Point 1', 'Point 2', 'Point 3'] }.`,
                },
                {
                    role: 'user',
                    content: `Subject: ${subject || 'No Subject'}\n\n${emailBody}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const data = JSON.parse(content);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Summarize error:', error);
        return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
    }
}
