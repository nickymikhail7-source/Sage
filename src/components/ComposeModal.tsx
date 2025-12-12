'use client';

import { useState, useRef, useEffect } from 'react';
import {
    X, Send, Mic, Loader2, Sparkles, Paperclip, Image,
    Clock, ChevronDown, ChevronUp, Smile, AtSign, Hash,
    Bold, Italic, Link, List, ListOrdered
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    replyTo?: {
        email: string;
        subject: string;
        name?: string;
        threadId?: string;
    };
}

export function ComposeModal({ isOpen, onClose, replyTo }: ComposeModalProps) {
    const [to, setTo] = useState(replyTo?.email || '');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(true);

    const bodyRef = useRef<HTMLTextAreaElement>(null);

    // Auto-save draft
    useEffect(() => {
        if (body || subject || to) {
            setIsSaved(false);
            const timer = setTimeout(() => {
                // Save draft logic here
                setIsSaved(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [body, subject, to]);

    // Voice input
    const { isListening, isProcessing, toggleListening } = useVoiceInput({
        onTranscript: async (text) => {
            setVoiceTranscript(text);
            await generateEmailFromVoice(text);
        },
        onError: (error) => console.error('Voice error:', error),
    });

    const generateEmailFromVoice = async (voiceText: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/compose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voiceCommand: voiceText,
                    context: { to, subject, isReply: !!replyTo, replyToName: replyTo?.name },
                }),
            });
            const data = await response.json();
            if (data.subject && !subject) setSubject(data.subject);
            if (data.body) setBody(data.body);
            if (data.to && !to) setTo(data.to);
        } catch (error) {
            console.error('Email generation error:', error);
        } finally {
            setIsGenerating(false);
            setVoiceTranscript('');
        }
    };

    const handleSend = async () => {
        if (!to || !body) return;
        setIsSending(true);
        try {
            // In a real app we would get the accessToken from context or auth hook
            // For now we assume the API handles it or we pass it if available contextually
            // However the provided snippet didn't include accessToken prop, assuming API handles session via cookies or similar if configured,
            // or we might need to modify this later. For now sticking to user provided code.
            const response = await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, cc, bcc, subject, body, scheduledTime }),
            });
            if (response.ok) {
                onClose();
                setTo(''); setSubject(''); setBody('');
            }
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Keyboard shortcut: Cmd+Enter to send
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isOpen) {
                e.preventDefault();
                handleSend();
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, to, body]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-zinc-100">
                            {replyTo ? 'Reply' : 'New Message'}
                        </h2>
                        {/* Draft status */}
                        <span className="text-xs text-zinc-500">
                            {isSaved ? '✓ Saved' : 'Saving...'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Recipients */}
                <div className="px-4 py-2 border-b border-zinc-800/50 space-y-2">
                    {/* To field */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-zinc-500 w-12">To</label>
                        <input
                            type="email"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="recipient@email.com"
                            className="flex-1 px-2 py-1.5 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-sm"
                            autoFocus={!replyTo}
                        />
                        <button
                            onClick={() => setShowCcBcc(!showCcBcc)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showCcBcc ? 'Hide' : 'Cc/Bcc'}
                        </button>
                    </div>

                    {/* CC/BCC fields */}
                    {showCcBcc && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-zinc-500 w-12">Cc</label>
                                <input
                                    type="email"
                                    value={cc}
                                    onChange={(e) => setCc(e.target.value)}
                                    placeholder="cc@email.com"
                                    className="flex-1 px-2 py-1.5 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-zinc-500 w-12">Bcc</label>
                                <input
                                    type="email"
                                    value={bcc}
                                    onChange={(e) => setBcc(e.target.value)}
                                    placeholder="bcc@email.com"
                                    className="flex-1 px-2 py-1.5 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* Subject field */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-zinc-500 w-12">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="What's this about?"
                            className="flex-1 px-2 py-1.5 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Voice Transcript Banner */}
                {(isListening || voiceTranscript || isGenerating) && (
                    <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                            {isListening && (
                                <>
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-sm text-emerald-400">Listening...</span>
                                </>
                            )}
                            {isGenerating && (
                                <>
                                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                    <span className="text-sm text-emerald-400">Writing your email...</span>
                                </>
                            )}
                            {voiceTranscript && !isGenerating && (
                                <span className="text-sm text-emerald-300">"{voiceTranscript}"</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-hidden relative">
                    <textarea
                        ref={bodyRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message... or click the mic to speak"
                        className="w-full h-full min-h-[300px] px-4 py-3 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none text-sm leading-relaxed"
                    />

                    {/* AI generating overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                                </div>
                                <span className="text-sm text-zinc-300">Composing email...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Formatting toolbar (optional) */}
                <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Link className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <List className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                    <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Smile className="w-4 h-4" />
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950/50">
                    {/* Left side - Voice & AI */}
                    <div className="flex items-center gap-2">
                        {/* Voice button */}
                        <button
                            onClick={toggleListening}
                            disabled={isProcessing || isGenerating}
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isListening
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                                }
              `}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Mic className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                                {isListening ? 'Listening...' : 'Voice'}
                            </span>
                        </button>

                        {/* AI Improve button */}
                        <button
                            onClick={() => body && generateEmailFromVoice(`Improve and make this email more professional: ${body}`)}
                            disabled={isGenerating || !body}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Improve</span>
                        </button>

                        {/* Attachments */}
                        <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                            <Paperclip className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right side - Schedule & Send */}
                    <div className="flex items-center gap-2">
                        {/* Schedule send */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSchedule(!showSchedule)}
                                className={`p-2 rounded-lg transition-colors ${scheduledTime
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                            </button>

                            {/* Schedule dropdown */}
                            {showSchedule && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1">
                                    <button
                                        onClick={() => { setScheduledTime(null); setShowSchedule(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                                    >
                                        Send now
                                    </button>
                                    <button
                                        onClick={() => { setScheduledTime('tomorrow-9am'); setShowSchedule(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                                    >
                                        Tomorrow at 9:00 AM
                                    </button>
                                    <button
                                        onClick={() => { setScheduledTime('monday-9am'); setShowSchedule(false); }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700"
                                    >
                                        Monday at 9:00 AM
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cancel */}
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={!to || !body || isSending}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>{scheduledTime ? 'Schedule' : 'Send'}</span>
                            <span className="hidden sm:inline text-emerald-200 text-xs">⌘↵</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
