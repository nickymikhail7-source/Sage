'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchThreadAction } from '@/app/actions';

interface ThreadViewProps {
    threadId: string | null;
    accessToken: string;
    onClose: () => void;
}

export function ThreadView({ threadId, accessToken, onClose }: ThreadViewProps) {
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
            // Optimization: Limit to last 10 messages to avoid token limits
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
            console.log('📩 Summary API response:', data);

            if (data.summary) {
                setSummary(data.summary);
            } else if (data.error) {
                throw new Error(data.error);
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

        // 1. Fetch Thread via Server Bridge
        const result = await fetchThreadAction(accessToken, threadId);

        if (result.success && result.messages) {
            // SORT: Newest First (Reverse Chronological)
            const sorted = result.messages.sort((a: any, b: any) =>
                new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
            );

            setMessages(sorted);
            setLoading(false);

            // Default: Expand only the newest message (index 0)
            if (sorted.length > 0) {
                setExpandedIds(new Set([sorted[0].id]));
                // 2. Trigger AI Summary
                generateSummary(sorted);
            }
        } else {
            setError(result.error || 'Failed to load thread.');
            setMessages([]);
            setLoading(false);
        }
    }, [threadId, accessToken, generateSummary]);

    useEffect(() => {
        // Force wipe old state immediately when threadId changes
        setMessages([]);
        setSummary(null);
        refreshThread();
    }, [refreshThread]);

    const toggleMessage = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const expandAll = () => {
        const allIds = new Set(messages.map(m => m.id));
        setExpandedIds(allIds);
    };

    return (
        <AnimatePresence>
            {threadId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[800px] bg-zinc-950 border-l border-white/10 shadow-2xl z-[70] flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md">
                            <div className="flex flex-col gap-1 min-w-0">
                                <h2 className="text-xl font-semibold text-white truncate pr-4">
                                    {messages[0]?.subject || 'Conversation'}
                                </h2>
                                {messages.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                        <span>{messages.length} messages</span>
                                        {messages.length > 1 && expandedIds.size < messages.length && (
                                            <button
                                                onClick={expandAll}
                                                className="text-purple-400 hover:text-purple-300 transition-colors ml-2 underline underline-offset-2"
                                            >
                                                Expand All
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

                            {/* AI Summary Card (Amber/Orange Theme) */}
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-2 mb-4 text-amber-500 relative z-10">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-wide uppercase">Sage Summary</span>
                                </div>

                                {summarizing ? (
                                    <div className="space-y-3 animate-pulse relative z-10">
                                        <div className="flex items-center gap-2 text-amber-500/50 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Generating summary...</span>
                                        </div>
                                    </div>
                                ) : summary ? (
                                    <p className="text-zinc-300 text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
                                        {summary}
                                    </p>
                                ) : (
                                    <p className="text-zinc-500 text-sm italic relative z-10">
                                        {loading ? 'Waiting for content...' : 'Could not generate summary.'}
                                    </p>
                                )}
                            </div>

                            {/* Message List */}
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    <p className="text-zinc-500 text-sm">Fetching secure thread...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-4">
                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm max-w-xs break-words">
                                            {error}
                                        </div>
                                    )}
                                    <p>No messages found.</p>
                                    <button
                                        onClick={refreshThread}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-sm transition-colors border border-white/5"
                                    >
                                        Retry Fetch
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => {
                                        const isExpanded = expandedIds.has(msg.id);
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`rounded-xl transition-all duration-200 overflow-hidden border ${isExpanded
                                                    ? 'bg-white/5 border-white/10'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] cursor-pointer'
                                                    }`}
                                                onClick={() => !isExpanded && toggleMessage(msg.id)}
                                            >
                                                {/* Message Header */}
                                                <div
                                                    className={`flex justify-between p-4 ${isExpanded ? 'border-b border-white/5' : ''}`}
                                                    onClick={(e) => {
                                                        if (isExpanded) {
                                                            e.stopPropagation();
                                                            toggleMessage(msg.id);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shrink-0 ${isExpanded ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                                                            }`}>
                                                            {msg.from?.name?.[0] || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={`font-bold text-sm truncate ${isExpanded ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                                                {msg.from?.name}
                                                            </div>
                                                            <div className="text-xs text-zinc-500 truncate">{msg.from?.address}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4 shrink-0">
                                                        <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                                                            {new Date(msg.createdTime).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            className="text-zinc-500 hover:text-white transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Pre-collapsed Snippet */}
                                                {!isExpanded && (
                                                    <div className="px-4 pb-4 pt-0 text-sm text-zinc-500 truncate pl-[3.25rem]">
                                                        {msg.snippet}
                                                    </div>
                                                )}

                                                {/* Expanded Body */}
                                                {isExpanded && (
                                                    <div className="p-6">
                                                        <div
                                                            className="prose prose-invert prose-sm max-w-none text-zinc-300 break-words"
                                                            dangerouslySetInnerHTML={{ __html: msg.body }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
