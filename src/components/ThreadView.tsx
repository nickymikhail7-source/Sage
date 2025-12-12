'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Archive, Reply as ReplyIcon, Forward, Clock, Calendar, Send, Mic } from 'lucide-react';
import { fetchThreadAction } from '@/app/actions';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { EmailBodyRenderer } from '@/components/EmailBodyRenderer';
import { extractHtmlBody } from '@/lib/email-utils';

interface ThreadViewProps {
    threadId: string | null;
    accessToken: string;
    onClose: () => void;
}

export function ThreadView({ threadId, accessToken, onClose }: ThreadViewProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<{ summary: string[], category: string } | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Unified Input State
    const [mode, setMode] = useState<'reply' | 'ai'>('reply');
    const [inputText, setInputText] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Voice Hook
    const handleVoiceTranscript = (text: string) => {
        setInputText(text);
        // Automatically switch to AI mode if it sounds like a command? 
        // For now, let user decide context or straightforward input
    };

    const { isListening, isProcessing: isVoiceProcessing, toggleListening } = useVoiceInput(handleVoiceTranscript);

    const generateSummary = useCallback(async (msgs: any[]) => {
        setSummarizing(true);
        try {
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
            setSummaryData(data);

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
        setSummaryData(null);
        setMessages([]);
        setExpandedIds(new Set());

        const result = await fetchThreadAction(accessToken, threadId);

        if (result.success && result.messages) {
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
        setSummaryData(null);
        refreshThread();
    }, [refreshThread]);

    const toggleMessage = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const handleUnifiedSubmit = async () => {
        if (!inputText.trim()) return;

        if (mode === 'ai') {
            setIsAiProcessing(true);
            try {
                // Determine context for AI
                const context = {
                    sender: messages[0]?.from?.name,
                    subject: messages[0]?.subject,
                    content: messages[0]?.snippet
                };

                const res = await fetch('/api/voice/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: inputText, context })
                });

                const data = await res.json();
                if (data.response) {
                    // For now just alert or log, in real app add to chat or toast
                    alert(`Sage: ${data.response}`);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsAiProcessing(false);
                setInputText('');
            }
        } else {
            // Reply mode - stubbed for now
            console.log('Sending reply:', inputText);
            setInputText('');
            alert('Reply sent!');
        }
    };

    const generateAIDraft = async () => {
        // Placeholder for draft generation
        setInputText("Here is a draft generated by AI based on the conversation context...");
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p>Loading...</p>
            </div>
        );
    }

    if (error || messages.length === 0) {
        return <div className="h-full flex items-center justify-center">{error || 'No messages'}</div>;
    }

    const latestMessage = messages[0];
    const category = summaryData?.category || 'fyi';
    const categoryBadges: Record<string, any> = {
        decision: { label: 'Action Needed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
        fyi: { label: 'FYI', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        gatekeeper: { label: 'Start', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
    };
    const badge = categoryBadges[category] || categoryBadges['fyi'];

    return (
        <div className="h-full flex flex-col bg-zinc-950 relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 px-8 py-5 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-xl font-bold text-zinc-100 mb-1 leading-tight line-clamp-2">
                        {latestMessage.subject || '(No Subject)'}
                    </h1>
                    {summaryData && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${badge.color} whitespace-nowrap`}>
                            {badge.label}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-2">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-medium text-zinc-400">Inbox</span>
                    <span>•</span>
                    <span>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 pb-40"> {/* pb-40 for sticky footer */}
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Always visible Summary Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-amber-500 uppercase tracking-wide">Sage Summary</span>
                        </div>

                        {summarizing ? (
                            <div className="flex items-center gap-2 text-amber-500/50 text-sm animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating summary...</span>
                            </div>
                        ) : summaryData ? (
                            <ul className="space-y-2.5">
                                {(summaryData.summary || []).map((point: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed">
                                        <span className="text-amber-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="space-y-2">
                                <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4"></div>
                                <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2"></div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
                        <ActionButton icon={<Archive className="w-4 h-4" />} label="Archive" onClick={() => { }} />
                        <ActionButton icon={<ReplyIcon className="w-4 h-4" />} label="Reply" onClick={() => { }} />
                        <ActionButton icon={<Forward className="w-4 h-4" />} label="Forward" onClick={() => { }} />
                        <ActionButton icon={<Clock className="w-4 h-4" />} label="Snooze" onClick={() => { }} />
                        <div className="flex-1" />
                        <ActionButton icon={<Calendar className="w-4 h-4" />} label="Schedule" variant="primary" onClick={() => { }} />
                    </div>

                    {/* Messages */}
                    <div className="space-y-6">
                        {messages.map((msg) => {
                            const isExpanded = expandedIds.has(msg.id);

                            // Debug Log
                            console.log(`Msg ${msg.id} Body Check:`, {
                                hasHtmlBody: !!msg.htmlBody,
                                htmlBodyLen: msg.htmlBody?.length,
                                hasBodyObj: typeof msg.body === 'object',
                                bodyContent: typeof msg.body === 'string' ? msg.body.substring(0, 50) : msg.body?.content?.substring(0, 50),
                                fullMsgKeys: Object.keys(msg)
                            });

                            return (
                                <div
                                    key={msg.id}
                                    className={`
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
                                                    <span className={`text - sm font - medium ${ isExpanded ? 'text-zinc-100' : 'text-zinc-400' } `}>
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

                                            {!isExpanded && (
                                                <p className="text-sm text-zinc-500 truncate">{msg.snippet}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* HTML Body */}
                                    {isExpanded && (
                                        <div className="px-4 pb-6 pl-[4.5rem]">
                                            <EmailBodyRenderer
                                                html={extractHtmlBody(msg)}
                                                className="text-zinc-300"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Unified Input Bar (Sticky Footer) */}
            <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm p-4 z-20">
                <div className="max-w-3xl mx-auto">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setMode('reply')}
                            className={`px - 3 py - 1 text - xs font - medium rounded - full transition - colors ${
                                mode === 'reply'
                                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                : 'text-zinc-500 hover:text-zinc-300'
                            } `}
                        >
                            Reply
                        </button>
                        <button
                            onClick={() => setMode('ai')}
                            className={`px - 3 py - 1 text - xs font - medium rounded - full transition - colors ${
                                mode === 'ai'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                : 'text-zinc-500 hover:text-zinc-300'
                            } `}
                        >
                            ✨ Ask Sage
                        </button>
                    </div>

                    {/* Unified Input */}
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={mode === 'reply' ? 'Write your reply...' : 'Ask Sage anything...'}
                                disabled={isAiProcessing || isVoiceProcessing}
                                rows={2}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
                            />

                            {/* AI Draft Button within Input */}
                            {mode === 'reply' && !inputText && (
                                <button
                                    onClick={generateAIDraft}
                                    className="absolute right-3 bottom-3 text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    AI Draft
                                </button>
                            )}
                        </div>

                        {/* Voice Button */}
                        <button
                            onClick={toggleListening}
                            disabled={isAiProcessing}
                            className={`w - 12 h - 12 rounded - xl flex items - center justify - center transition - all flex - shrink - 0 ${
                                isListening
                                    ? 'bg-emerald-500 text-white animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                            } `}
                        >
                            {isVoiceProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={handleUnifiedSubmit}
                            disabled={!inputText.trim() || isAiProcessing || isVoiceProcessing}
                            className="w-12 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            {isAiProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick, variant = 'default' }: { icon: any, label: string, onClick: () => void, variant?: 'default' | 'primary' }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items - center gap - 2 px - 3 py - 2 rounded - lg text - xs font - medium transition - all
                ${
                                variant === 'primary'
                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-transparent'
                            }
                            `}
        >
            {icon}
            {label}
        </button>
    );
}
