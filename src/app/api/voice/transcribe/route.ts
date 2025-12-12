import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as Blob;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Convert blob to file for OpenAI
        const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Failed to transcribe' }, { status: 500 });
    }
}
