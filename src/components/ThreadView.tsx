'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
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
    const [summary, setSummary] = useState<string[] | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const [error, setError] = useState<string | null>(null); // New state for error

    const generateSummary = useCallback(async (msgs: any[]) => {
        setSummarizing(true);
        try {
            // Concatenate message snippets for context
            const conversationText = msgs.map(m => `${m.from.name}: ${m.snippet}`).join('\n');

            const res = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailBody: conversationText }),
            });
            const data = await res.json();

            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Summarize error:', err);
            setError('Failed to generate summary.');
        } finally {
            setSummarizing(false);
        }
    }, []); // No dependencies as it only uses state setters and fetch

    const refreshThread = useCallback(async () => {
        if (!threadId) return;
        setLoading(true);
        setError(null); // Clear any previous errors
        setSummary(null); // Reset summary
        setMessages([]); // Clear messages while loading

        // 1. Fetch Thread via Server Bridge
        const result = await fetchThreadAction(accessToken, threadId);

        if (result.success && result.messages) {
            setMessages(result.messages);
            setLoading(false);
            // 2. Trigger AI Summary
            if (result.messages.length > 0) {
                generateSummary(result.messages);
            }
        } else {
            setError(result.error || 'Failed to load thread.');
            setMessages([]);
            setLoading(false);
        }
    }, [threadId, accessToken, generateSummary]); // Dependencies for useCallback

    useEffect(() => {
        // Force wipe old state immediately when threadId changes
        setMessages([]);
        setSummary(null);
        refreshThread();
    }, [refreshThread]); // refreshThread is now a stable function due to useCallback

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
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-semibold text-white">Conversation</h2>
                                {messages.length > 0 && (
                                    <div className="text-xs text-zinc-500 font-mono">ID: {threadId}</div>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

                            {/* AI Summary Card */}
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-2 mb-4 text-purple-400 relative z-10">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-wide uppercase">Sage Summary</span>
                                </div>

                                {summarizing ? (
                                    <div className="space-y-3 animate-pulse relative z-10">
                                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-2 bg-white/10 rounded w-5/6"></div>
                                        <div className="h-2 bg-white/10 rounded w-2/3"></div>
                                    </div>
                                ) : summary ? (
                                    <ul className="space-y-3 relative z-10">
                                        {summary.map((point, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-zinc-500 text-sm italic relative z-10">
                                        {loading ? 'Analyzing conversation...' : 'Waiting for content...'}
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
                                <div className="space-y-6">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition-colors">
                                            <div className="flex justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 border border-white/10">
                                                        {msg.from?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-200 text-sm">{msg.from?.name}</div>
                                                        <div className="text-xs text-zinc-500">{msg.from?.address}</div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-zinc-500 font-medium bg-white/5 px-2 py-1 rounded self-start">
                                                    {new Date(msg.createdTime).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div
                                                className="prose prose-invert prose-sm max-w-none text-zinc-300"
                                                dangerouslySetInnerHTML={{ __html: msg.body }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
