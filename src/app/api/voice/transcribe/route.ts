import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as Blob;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        const openai = getOpenAIClient();

        // Convert Blob to File for OpenAI API
        const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'en',
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
