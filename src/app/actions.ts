'use server';

import { getThreadMessages } from '@/lib/aurinko';

export async function fetchThreadAction(accessToken: string, threadId: string) {
    if (!threadId || threadId === 'undefined') {
        return { error: "Missing Thread ID", messages: [] };
    }

    try {
        const messages = await getThreadMessages(accessToken, threadId);
        return { success: true, messages };
    } catch (error: any) {
        console.error("Bridge Error:", error.message);
        return { error: "Failed to fetch thread", messages: [] };
    }
}
