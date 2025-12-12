'use client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { EmailMessage } from '@/lib/aurinko';
import { VoiceOrb } from '@/components/VoiceOrb';
import { ThreadView } from '@/components/ThreadView';
import { ComposeDrawer } from '@/components/ComposeDrawer';

export function Dashboard({ initialEmails, accessToken }: { initialEmails: any[], accessToken: string }) {
    const [emails] = useState<EmailMessage[]>(initialEmails);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [draftData, setDraftData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    // Prevent Hydration Mismatch by delaying strict renders
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDraftReady = (data: any) => {
        const cleanBody = data.body ? data.body.replace(/<br\s*\/?>/gi, '\n') : '';
        setDraftData({ ...data, body: cleanBody });
        setIsComposeOpen(true);
    };

    // Restored handleSend to ensure ComposeDrawer works with current architecture
    const handleSend = async (data: any) => {
        await fetch('/api/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, accessToken }),
        });
    };

    return (
        <div className="w-full h-full flex bg-black text-white overflow-hidden font-sans">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-white/10 flex flex-col h-full bg-zinc-950">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Sage Inbox
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {emails.map((email) => (
                        <div
                            key={email.id}
                            onClick={() => {
                                console.log("Clicked:", email.subject, "ID:", email.threadId);
                                if (email.threadId) setSelectedThreadId(email.threadId);
                            }}
                            className={`group flex flex-col p-4 border-b border-white/5 cursor-pointer transition-all ${selectedThreadId === email.threadId ? 'bg-white/10' : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-white truncate pr-2 text-sm flex-1">
                                    {email.from.name || email.from.address}
                                </span>
                                {/* CRASH FIX: suppressHydrationWarning */}
                                <span suppressHydrationWarning className="text-xs text-zinc-500 whitespace-nowrap">
                                    {mounted ? formatDistanceToNow(new Date(email.createdTime), { addSuffix: true }) : ''}
                                </span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 pr-4">
                                <div className="text-sm font-medium text-zinc-300 truncate mb-1">
                                    {email.subject || '(No Subject)'}
                                </div>
                                <div className="text-xs text-zinc-500 truncate">
                                    {email.snippet}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Voice Orb Footer */}
                <div className="p-6 border-t border-white/10 flex justify-center bg-black/50 backdrop-blur-lg">
                    <VoiceOrb onDraftReady={handleDraftReady} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-zinc-900/50 relative">
                {!selectedThreadId && (
                    <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-4 opacity-50">
                        <div className="text-4xl">📬</div>
                        <div>Select an email to view details</div>
                    </div>
                )}

                {/* Thread View Slide-over */}
                {selectedThreadId && (
                    <ThreadView
                        threadId={selectedThreadId}
                        accessToken={accessToken}
                        onClose={() => setSelectedThreadId(null)}
                    />
                )}
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
