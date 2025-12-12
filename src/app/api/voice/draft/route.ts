import { NextResponse } from 'next/server';
import { generateDraft } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const { subject, body } = await generateDraft(text);
        return NextResponse.json({ subject, body });
    } catch (error) {
        console.error('Draft generation error:', error);
        return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
    }
}
