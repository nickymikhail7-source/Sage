'use client';

import { useState, useRef, useCallback } from 'react';

interface UseVoiceInputOptions {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startListening = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                try {
                    // Send to transcription API
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');

                    const response = await fetch('/api/voice/transcribe', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Transcription failed');
                    }

                    const data = await response.json();

                    if (data.text) {
                        onTranscript(data.text);
                    } else if (data.error) {
                        onError?.(data.error);
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                    onError?.('Failed to transcribe audio');
                } finally {
                    setIsProcessing(false);
                }

                // Stop all audio tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error('Microphone error:', error);
            onError?.('Could not access microphone. Please allow microphone permissions.');
        }
    }, [onTranscript, onError]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        isProcessing,
        toggleListening,
        startListening,
        stopListening,
    };
}
