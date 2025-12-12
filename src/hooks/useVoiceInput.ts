import { useState, useRef, useCallback } from 'react';

export function useVoiceInput(onTranscript: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startListening = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
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

                // Send to transcription API
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                try {
                    const response = await fetch('/api/voice/transcribe', {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await response.json();
                    if (data.text) {
                        onTranscript(data.text);
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                }

                setIsProcessing(false);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error('Microphone error:', error);
        }
    }, [onTranscript]);

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
