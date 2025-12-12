'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComposeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialDraft?: { to: string; subject: string; body: string };
    onSend: (data: { to: string; subject: string; body: string }) => Promise<void>;
}

export function ComposeDrawer({ isOpen, onClose, initialDraft, onSend }: ComposeDrawerProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && initialDraft) {
            setTo(initialDraft.to || '');
            setSubject(initialDraft.subject || '');
            setBody(initialDraft.body || '');
        }
    }, [isOpen, initialDraft]);

    const handleSend = async () => {
        setIsSending(true);
        try {
            await onSend({ to, subject, body });
            onClose();
            // Reset after closing?
            setTo('');
            setSubject('');
            setBody('');
        } catch (error) {
            console.error('Failed to send:', error);
            alert('Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed bottom-0 right-0 md:right-8 md:bottom-8 w-full md:w-[600px] h-[80vh] bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white">New Message</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                            <input
                                type="text"
                                placeholder="To"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="bg-transparent border-b border-white/10 p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-transparent border-b border-white/10 p-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <textarea
                                placeholder="Write your message..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="flex-1 bg-transparent p-2 text-white placeholder-zinc-500 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
