import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(file: File) {
    const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
    });
    return response.text;
}

export async function generateDraft(prompt: string) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are Sage.
Rule 1 (Formatting): Return valid JSON { "subject": "...", "body": "..." }. Use <br> for newlines in the body.
Rule 2 (Names): If the user mentions a recipient name (e.g., 'to Nikhil'), use it (e.g., 'Dear Nikhil,'). If NO name is found, use 'Hi there,'. NEVER use placeholders like [Recipient's Name] or brackets [ ].
Rule 3 (Signature): Always sign off as 'Nikhil'.`,
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    return JSON.parse(content) as { subject: string; body: string };
}
