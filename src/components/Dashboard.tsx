'use client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { EmailMessage } from '@/lib/aurinko';
import { ThreadView } from '@/components/ThreadView';
import { ComposeDrawer } from '@/components/ComposeDrawer';
import { AIBar } from '@/components/AIBar';

export function Dashboard({ initialEmails, accessToken }: { initialEmails: any[], accessToken: string }) {
    const [emails] = useState<EmailMessage[]>(initialEmails);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [draftData, setDraftData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSend = async (data: any) => {
        await fetch('/api/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, accessToken }),
        });
    };

    const categoryColors: Record<string, string> = {
        decision: 'bg-red-500',
        fyi: 'bg-amber-500',
        gatekeeper: 'bg-emerald-500',
    };

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden w-full">

            {/* Column 2: Email List (380px Fixed) */}
            <div className="w-[380px] h-full border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-zinc-100">Inbox</h1>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {emails.map((email) => {
                        const isSelected = selectedThreadId === email.threadId;
                        const isRead = true; // Placeholder for now, Aurinko might provide this
                        // Mock category for visual - in real app, derive from tags
                        const category = null;

                        return (
                            <div
                                key={email.id}
                                onClick={() => setSelectedThreadId(email.threadId)}
                                className={`
                                    relative px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors
                                    ${isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'}
                                    ${!isRead ? 'bg-zinc-900/50' : ''}
                                `}
                            >
                                {/* Unread indicator */}
                                {!isRead && (
                                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}

                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300 flex-shrink-0 border border-white/5">
                                        {(email.from.name || email.from.address).charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: Sender + Time */}
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className={`text-sm truncate ${!isRead ? 'font-semibold text-zinc-100' : 'font-medium text-zinc-300'}`}>
                                                {email.from.name || email.from.address}
                                            </span>
                                            <span
                                                suppressHydrationWarning
                                                className="text-xs text-zinc-500 flex-shrink-0">
                                                {mounted ? formatDistanceToNow(new Date(email.createdTime), { addSuffix: true }) : ''}
                                            </span>
                                        </div>

                                        {/* Row 2: Subject */}
                                        <p className={`text-sm truncate mb-0.5 ${!isRead ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                            {email.subject || '(No Subject)'}
                                        </p>

                                        {/* Row 3: Preview */}
                                        <p className="text-xs text-zinc-500 truncate">
                                            {email.snippet}
                                        </p>
                                    </div>

                                    {/* Category indicator dot */}
                                    {category && (
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${categoryColors[category]}`} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Column 3: Detail View (Flexible) */}
            <div className="flex-1 bg-zinc-950 relative flex flex-col min-w-0">
                {selectedThreadId ? (
                    <div className="flex-1 overflow-hidden relative fade-in">
                        <ThreadView
                            threadId={selectedThreadId}
                            accessToken={accessToken}
                            onClose={() => setSelectedThreadId(null)}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
                            <span className="text-3xl">📬</span>
                        </div>
                        <p>Select an email to view details</p>
                    </div>
                )}

                {/* AI Bar Floating at bottom */}
                <AIBar />
            </div>

            <ComposeDrawer
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                initialDraft={draftData}
                onSend={handleSend}
            />
        </div>
    );
}
