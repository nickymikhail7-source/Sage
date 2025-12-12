import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { to, subject, body, accessToken } = await req.json();

        if (!to || !subject || !body || !accessToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Convert newlines to HTML breaks for email client
        const htmlBody = body.replace(/\n/g, '<br>');

        // Call Aurinko API
        // https://docs.aurinko.io/unified-api/email/sending-messages
        const response = await axios.post(
            'https://api.aurinko.io/v1/email/messages',
            {
                subject,
                body: htmlBody,
                to: [{ address: to }]
            },
            {
                params: {
                    send: true // Helper to send immediately
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return NextResponse.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ error: 'Failed to send email', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
