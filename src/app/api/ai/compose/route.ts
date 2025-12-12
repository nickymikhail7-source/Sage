import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { voiceCommand, context } = await req.json();

        if (!voiceCommand) {
            return NextResponse.json(
                { error: 'No voice command provided' },
                { status: 400 }
            );
        }

        const openai = getOpenAIClient();

        const systemPrompt = `You are Sage, an AI email assistant powering a voice commmand to email composer.
    
    Context:
    - To: ${context?.to || 'Unknown'}
    - Subject: ${context?.subject || 'Unknown'}
    - Is Reply: ${context?.isReply ? 'Yes' : 'No'}
    - Replying to: ${context?.replyToName || 'Unknown'}

    Your task is to generate a JSON object with:
    1. "subject": Suggested subject line (if vague or missing)
    2. "body": The email body text based on the user's voice command.
    3. "to": Extracted email address if spoken (e.g. "email john at example dot com").

    If the user says "Improve this", the voiceCommand will contain the existing body. Improve it to be more professional.
    If the user dictates an email, transcribe and format it nicely.
    Do not include "Dear [Name]" if it is already in the context, but do include it if starting a new thread.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: voiceCommand }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1000,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

        return NextResponse.json(result);
    } catch (error) {
        console.error('Compose API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate email' },
            { status: 500 }
        );
    }
}
