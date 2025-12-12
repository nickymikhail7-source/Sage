import { NextResponse } from 'next/server';
import { getThreadMessages } from '@/lib/aurinko';

export async function POST(req: Request) {
    try {
        const { threadId, accessToken } = await req.json();

        if (!threadId || !accessToken) {
            return NextResponse.json({ error: 'Missing threadId or accessToken' }, { status: 400 });
        }

        const messages = await getThreadMessages(accessToken, threadId);
        return NextResponse.json({ messages });

    } catch (error) {
        console.error('Fetch thread error:', error);
        return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
    }
}
