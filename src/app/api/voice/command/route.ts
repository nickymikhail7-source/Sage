import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { command, context } = await req.json();

        if (!command) {
            return NextResponse.json(
                { error: 'No command provided' },
                { status: 400 }
            );
        }

        const openai = getOpenAIClient();

        const systemPrompt = `You are Sage, an AI email assistant. The user has given you a voice command.

${context ? `Current context:
- Viewing email from: ${context.sender || 'unknown'}
- Subject: ${context.subject || 'unknown'}
- Email preview: ${context.preview || 'none'}
` : 'No email is currently selected.'}

Based on the user's command, respond with a JSON object containing:
1. "action": one of ["reply", "archive", "forward", "snooze", "schedule", "search", "compose", "chat"]
2. "response": a helpful response to show the user (1-2 sentences)
3. "draft": if action is "reply" or "compose", include a draft email text
4. "searchQuery": if action is "search", include what to search for

Be concise and helpful. If the user wants to reply, write a professional draft.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: command }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

        return NextResponse.json(result);
    } catch (error) {
        console.error('Command processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process command' },
            { status: 500 }
        );
    }
}
