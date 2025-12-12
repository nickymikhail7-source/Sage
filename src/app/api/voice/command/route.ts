import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const { command, context } = await req.json();

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are Sage, an AI email assistant. The user has given you a voice command.
          
Current context:
- Viewing email from: ${context?.sender || 'unknown'}
- Subject: ${context?.subject || 'unknown'}
- Email content snippet: ${context?.content?.substring(0, 500) || 'none'}

Respond to the user's command. If they want to:
- Reply to email: Generate a draft reply
- Summarize: Provide a summary if not already looking at one
- Explain: Explain the email
- Archive/Delete: Confirm the action
- Schedule meeting: Suggest times

Be concise and helpful.`
                },
                {
                    role: 'user',
                    content: command
                }
            ],
            max_tokens: 500,
        });

        return NextResponse.json({
            response: completion.choices[0]?.message?.content,
            action: detectAction(command),
        });
    } catch (error) {
        console.error('Command error:', error);
        return NextResponse.json({ error: 'Failed to process command' }, { status: 500 });
    }
}

function detectAction(command: string): string {
    const lower = command.toLowerCase();
    if (lower.includes('reply') || lower.includes('respond')) return 'reply';
    if (lower.includes('archive') || lower.includes('delete')) return 'archive';
    if (lower.includes('schedule') || lower.includes('meeting') || lower.includes('calendar')) return 'schedule';
    if (lower.includes('forward')) return 'forward';
    if (lower.includes('snooze') || lower.includes('remind')) return 'snooze';
    return 'chat';
}
