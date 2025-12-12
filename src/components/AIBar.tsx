'use client';
import { useState } from 'react';

export function AIBar() {
    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState('');

    return (
        <div className="fixed bottom-0 left-16 right-0 p-4 pointer-events-none z-[100]">
            <div className="max-w-2xl mx-auto pointer-events-auto">
                <div className={`
          flex items-center gap-3 px-4 py-3 
          bg-zinc-900/95 backdrop-blur-sm
          border border-zinc-700 
          rounded-2xl 
          shadow-2xl shadow-black/50
          transition-all
          ${isListening ? 'border-emerald-500/50 shadow-emerald-500/10' : ''}
        `}>
                    {/* Sparkle icon */}
                    <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>

                    {/* Input */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Sage anything..."
                        className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-sm"
                    />

                    {/* Voice button */}
                    <button
                        onClick={() => setIsListening(!isListening)}
                        className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isListening
                                ? 'bg-emerald-500 text-white scale-110 voice-active'
                                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                            }
            `}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
