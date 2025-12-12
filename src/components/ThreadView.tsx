'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchThreadAction } from '@/app/actions';

interface ThreadViewProps {
    threadId: string | null;
    accessToken: string;
    onClose: () => void;
}

export function ThreadView({ threadId, accessToken }: ThreadViewProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const generateSummary = useCallback(async (msgs: any[]) => {
        setSummarizing(true);
        try {
            // Concatenate message snippets for context
            const recentMsgs = msgs.slice(0, 10);
            const conversationText = recentMsgs.map(m => `From ${m.from.name} (${new Date(m.createdTime).toLocaleDateString()}): ${m.snippet}`).join('\n');
            const subject = msgs[0]?.subject || 'No Subject';

            const res = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailBody: conversationText,
                    subject: subject
                }),
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Summarize error:', err);
        } finally {
            setSummarizing(false);
        }
    }, []);

    const refreshThread = useCallback(async () => {
        if (!threadId) return;
        setLoading(true);
        setError(null);
        setSummary(null);
        setMessages([]);
        setExpandedIds(new Set());

        const result = await fetchThreadAction(accessToken, threadId);

        if (result.success && result.messages) {
            // Sort Newest First
            const sorted = result.messages.sort((a: any, b: any) =>
                new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
            );

            setMessages(sorted);
            setLoading(false);

            if (sorted.length > 0) {
                setExpandedIds(new Set([sorted[0].id]));
                generateSummary(sorted);
            }
        } else {
            setError(result.error || 'Failed to load thread.');
            setMessages([]);
            setLoading(false);
        }
    }, [threadId, accessToken, generateSummary]);

    useEffect(() => {
        setMessages([]);
        setSummary(null);
        refreshThread();
    }, [refreshThread]);

    const toggleMessage = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p>Loading conversation...</p>
            </div>
        );
    }

    if (error || messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                <p>{error || 'No messages found.'}</p>
                <button
                    onClick={refreshThread}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-sm border border-white/5"
                >
                    Retry
                </button>
            </div>
        );
    }

    const latestMessage = messages[0];

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 px-8 py-5 flex-shrink-0">
                <h1 className="text-xl font-bold text-zinc-100 mb-1 leading-tight">
                    {latestMessage.subject || '(No Subject)'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-medium text-zinc-400">Inbox</span>
                    <span>•</span>
                    <span>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 pb-24">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* AI Summary Card */}
                    <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-amber-500 uppercase tracking-wide">Sage Summary</span>
                        </div>

                        {summarizing ? (
                            <div className="flex items-center gap-2 text-amber-500/50 text-sm animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating summary...</span>
                            </div>
                        ) : summary ? (
                            <ul className="space-y-2.5">
                                {summary.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-')).map((point, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                                        <span className="text-amber-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <span>{point.replace(/^[•-]\s*/, '').trim()}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-zinc-500 italic">No summary available.</p>
                        )}
                    </div>

                    {/* Message List */}
                    <div className="space-y-6">
                        {messages.map((msg) => {
                            const isExpanded = expandedIds.has(msg.id);
                            return (
                                <div
                                    key={msg.id}
                                    className={`
                                        rounded-xl border transition-all duration-200 overflow-hidden
                                        ${isExpanded ? 'bg-zinc-900/30 border-zinc-800' : 'bg-transparent border-transparent hover:bg-zinc-900/50 cursor-pointer'}
                                    `}
                                    onClick={() => !isExpanded && toggleMessage(msg.id)}
                                >
                                    {/* Sender Header */}
                                    <div className="flex items-start gap-4 p-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                                            ${isExpanded ? 'bg-gradient-to-br from-zinc-700 to-zinc-600 text-zinc-100 border border-white/10' : 'bg-zinc-800 text-zinc-500'}
                                        `}>
                                            {(msg.from?.name || '?').charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${isExpanded ? 'text-zinc-100' : 'text-zinc-400'}`}>
                                                        {msg.from?.name}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 hidden sm:inline">&lt;{msg.from?.address}&gt;</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(msg.createdTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                    {isExpanded && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleMessage(msg.id); }}
                                                            className="text-zinc-500 hover:text-zinc-300 p-1"
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Collapsed Preview */}
                                            {!isExpanded && (
                                                <p className="text-sm text-zinc-500 truncate">{msg.snippet}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Body using CSS class for styles */}
                                    {isExpanded && (
                                        <div className="px-4 pb-6 pl-[4.5rem]">
                                            <div
                                                className="email-body-content"
                                                dangerouslySetInnerHTML={{ __html: msg.body }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
