'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Square } from 'lucide-react';

interface VoiceOrbProps {
    onDraftReady: (data: { subject: string; body: string }) => void;
}

export function VoiceOrb({ onDraftReady }: VoiceOrbProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                handleUpload(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const handleUpload = async (blob: Blob) => {
        try {
            // 1. Transcribe
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');

            const transcribeRes = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData,
            });
            const { text, error: transcribeError } = await transcribeRes.json();

            if (transcribeError) throw new Error(transcribeError);

            console.log('Transcribed Text:', text);

            // 2. Draft
            const draftRes = await fetch('/api/voice/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const { subject, body, error: draftError } = await draftRes.json();

            if (draftError) throw new Error(draftError);

            // 3. Output
            onDraftReady({ subject, body });

        } catch (err) {
            console.error('Error processing voice:', err);
            alert('Failed to process voice command. See console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClick = () => {
        if (isProcessing) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div
                className="relative flex items-center justify-center w-24 h-24 cursor-pointer"
                onClick={handleClick}
            >
                {/* Core Glow & Ring Animations */}
                <AnimatePresence mode='wait'>
                    {isRecording ? (
                        // Recording State (Red)
                        <>
                            <motion.div
                                key="recording-glow"
                                className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                key="recording-ring"
                                className="absolute inset-0 border border-red-500/50 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            />
                        </>
                    ) : isProcessing ? (
                        // Processing State (Blue/Spinner)
                        <>
                            <motion.div
                                key="processing-glow"
                                className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-40"
                            />
                            <motion.div
                                key="processing-ring"
                                className="absolute inset-0 border-t-2 border-blue-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </>
                    ) : (
                        // Idle State (Purple)
                        <>
                            <motion.div
                                key="idle-glow"
                                className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-40"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                                key="idle-ring"
                                className="absolute inset-0 border border-purple-500/30 rounded-full"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Inner Orb / Icon */}
                <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-lg z-10 transition-colors duration-300
                ${isRecording ? 'bg-red-500 shadow-red-500/50' : isProcessing ? 'bg-blue-600 shadow-blue-500/50' : 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-purple-500/50'}
            `}
                    animate={isRecording ? { scale: [1, 0.9, 1] } : { y: [0, -4, 0] }}
                    transition={isRecording ? { duration: 0.5, repeat: Infinity } : { duration: 4, repeat: Infinity }}
                >
                    {isRecording ? (
                        <Square className="w-5 h-5 text-white fill-current" />
                    ) : isProcessing ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                        <Mic className="w-6 h-6 text-white" />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
