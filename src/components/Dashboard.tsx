'use client';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { EmailMessage } from '@/lib/aurinko';
import { ThreadView } from '@/components/ThreadView';
import { ComposeModal } from '@/components/ComposeModal';
import { AIBar } from '@/components/AIBar';
import { Plus, Search } from 'lucide-react';

export function Dashboard({ initialEmails, accessToken }: { initialEmails: any[], accessToken: string }) {
    const [emails] = useState<EmailMessage[]>(initialEmails);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [draftData, setDraftData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState<'all' | 'decision' | 'fyi' | 'gatekeeper'>('all');

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
        gatekeeper: 'bg-zinc-500',
    };

    // Mock category assignment for demo purposes (randomly assign if missing)
    // In real app, this would come from DB/API
    const filteredEmails = emails.filter(email => {
        if (filter === 'all') return true;
        // Mock logic: assign based on index for demo consistency
        const mockCategory = ['decision', 'fyi', 'gatekeeper'][email.subject.length % 3];
        return mockCategory === filter;
    });

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden w-full">

            {/* Column 2: Email List (380px Fixed) */}
            <div className="w-[380px] h-full border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
                {/* Header with Search */}
                <div className="px-4 py-3 border-b border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-zinc-100">Inbox</h1>
                        <button
                            onClick={() => setIsComposeOpen(true)}
                            className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700/50 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'all', label: 'All', count: emails.length },
                        { id: 'decision', label: 'Action', count: Math.floor(emails.length * 0.3), color: 'text-red-400' },
                        { id: 'fyi', label: 'FYI', count: Math.floor(emails.length * 0.4), color: 'text-amber-400' },
                        { id: 'gatekeeper', label: 'Updates', count: Math.floor(emails.length * 0.3), color: 'text-zinc-400' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                                ${filter === tab.id
                                    ? 'bg-zinc-800 text-zinc-100 border border-white/5'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'}
                            `}
                        >
                            {tab.label}
                            {tab.id !== 'all' && <span className={`ml-1.5 ${tab.color} opacity-70`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.map((email) => {
                        const isSelected = selectedThreadId === email.threadId;
                        const isRead = true;
                        // Mock category
                        const category = ['decision', 'fyi', 'gatekeeper'][email.subject.length % 3];

                        return (
                            <div
                                key={email.id}
                                onClick={() => setSelectedThreadId(email.threadId)}
                                className={`
                                    relative px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors group
                                    ${isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-900/60'}
                                    ${!isRead ? 'bg-zinc-900/30' : ''}
                                `}
                            >
                                {/* Unread indicator */}
                                {!isRead && (
                                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}

                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300 flex-shrink-0 border border-white/5 shadow-sm">
                                        {(email.from.name || email.from.address).charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: Sender + Time */}
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className={`text-sm truncate ${!isRead ? 'font-bold text-zinc-100' : 'font-medium text-zinc-200'}`}>
                                                {email.from.name || email.from.address}
                                            </span>
                                            <span
                                                suppressHydrationWarning
                                                className="text-[10px] text-zinc-500 flex-shrink-0 uppercase tracking-wide font-medium">
                                                {mounted ? formatDistanceToNow(new Date(email.createdTime), { addSuffix: true }) : ''}
                                            </span>
                                        </div>

                                        {/* Row 2: Subject */}
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={`text-sm truncate flex-1 ${!isRead ? 'text-zinc-100' : 'text-zinc-400'}`}>
                                                {email.subject || '(No Subject)'}
                                            </p>
                                        </div>

                                        {/* Row 3: Snippet + Badges */}
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs text-zinc-500 truncate flex-1">
                                                {email.snippet}
                                            </p>

                                            {category === 'decision' && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
                                                    Action
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Column 3: Detail View (Flexible) */}
            <div className="flex-1 bg-zinc-950 relative flex flex-col min-w-0">
                {selectedThreadId ? (
                    <div className="flex-1 overflow-hidden relative fade-in h-full">
                        <ThreadView
                            threadId={selectedThreadId}
                            accessToken={accessToken}
                            onClose={() => setSelectedThreadId(null)}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-4 opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                            <span className="text-4xl filter grayscale">📬</span>
                        </div>
                        <p className="font-medium tracking-wide">Select an email to view details</p>
                    </div>
                )}


            </div>

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
            />
        </div>
    );
}
