'use client';

import { motion } from 'framer-motion';

export function VoiceOrb() {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="relative flex items-center justify-center w-24 h-24">
                {/* Core Glow */}
                <motion.div
                    className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-40"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 border border-purple-500/30 rounded-full"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />

                {/* Inner Orb */}
                <motion.div
                    className="w-12 h-12 bg-gradient-to-t from-purple-600 to-indigo-400 rounded-full shadow-[0_0_30px_rgba(147,51,234,0.6)] flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    animate={{
                        y: [0, -4, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="w-4 h-4 bg-white rounded-full blur-[1px]" />
                </motion.div>
            </div>
        </div>
    );
}
