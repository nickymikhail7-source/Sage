import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await transcribeAudio(file);
        return NextResponse.json({ text });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }
}
