'use client';

import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceButtonProps {
    onCommand: (command: string) => void;
    onDraft?: (draft: string) => void;
    context?: {
        sender?: string;
        subject?: string;
        preview?: string;
    };
    className?: string;
}

export function VoiceButton({ onCommand, onDraft, context, className = '' }: VoiceButtonProps) {
    const [response, setResponse] = useState<string | null>(null);

    const { isListening, isProcessing, toggleListening } = useVoiceInput({
        onTranscript: async (text) => {
            // Process the voice command
            try {
                const res = await fetch('/api/voice/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: text, context }),
                });

                const data = await res.json();

                if (data.response) {
                    setResponse(data.response);
                    // Clear response after 5 seconds
                    setTimeout(() => setResponse(null), 5000);
                }

                if (data.action && data.action !== 'chat') {
                    onCommand(data.action);
                }

                // If there's a draft, set it in the text field
                if (data.draft && onDraft) {
                    onDraft(data.draft);
                }
            } catch (error) {
                console.error('Command error:', error);
            }
        },
        onError: (error) => {
            setResponse(error);
            setTimeout(() => setResponse(null), 3000);
        },
    });

    return (
        <div className="relative">
            <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`
          w-12 h-12 rounded-xl flex items-center justify-center transition-all
          ${isListening
                        ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/30'
                        : isProcessing
                            ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                    }
          ${className}
        `}
                title={isListening ? 'Stop recording' : 'Start voice command'}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>

            {/* Voice feedback tooltip */}
            {(isListening || response) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 whitespace-nowrap shadow-xl z-50">
                    {isListening ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            Listening...
                        </span>
                    ) : response ? (
                        response
                    ) : null}
                </div>
            )}
        </div>
    );
}
