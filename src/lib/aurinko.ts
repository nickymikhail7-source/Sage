import axios from 'axios';

export interface EmailMessage {
    id: string;
    threadId: string;
    subject: string;
    snippet: string;
    body: string;
    from: { name: string; address: string };
    to: { name: string; address: string }[];
    createdTime: string;
}

// 1. Fetch Inbox (Dashboard)
export async function getAurinkoEmails(accessToken: string) {
    const response = await axios.get('https://api.aurinko.io/v1/email/messages', {
        params: { returnBody: false, limit: 20 },
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data.records || [];
}

// 2. Fetch Thread (Reader) - SINGLE STAGE SAFETY
export async function getThreadMessages(accessToken: string, threadId: string) {
    if (!threadId || threadId === 'undefined') {
        console.warn("Sage: Missing threadId.");
        return [];
    }

    console.log(`Sage: Fetching strictly for threadId: ${threadId}`);

    // STRATEGY: Fetch recent messages and filter in-memory.
    // We do NOT use 'q' parameter search because it causes leaks if the index is stale.
    try {
        const response = await axios.get('https://api.aurinko.io/v1/email/messages', {
            params: {
                returnBody: true,
                bodyType: 'html',
                limit: 50 // Fetch enough to find the thread
            },
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const allMessages = response.data.records || [];

        // MEMORY FILTER: This is the firewall.
        // Only allow messages where the ID matches exactly.
        const cleanMessages = allMessages.filter((msg: any) => msg.threadId === threadId);

        if (cleanMessages.length === 0) {
            console.log("Sage: No strict matches found in recent 50. Returning empty.");
        }

        return cleanMessages;
    } catch (error: any) {
        console.error("Sage: Fetch error", error.message);
        return [];
    }
}
