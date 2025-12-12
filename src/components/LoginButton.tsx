'use client';

import { useRouter } from 'next/navigation';

export function LoginButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/api/auth/login')}
            className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5 backdrop-blur-sm text-sm"
        >
            <span>Connect Google</span>
        </button>
    );
}
