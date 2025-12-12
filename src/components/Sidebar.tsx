'use client';

import { LayoutDashboard, Mail, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LoginButton } from './LoginButton';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Mail, label: 'Inbox', href: '/inbox' },
    { icon: User, label: 'Contacts', href: '/contacts' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-8 border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl z-50">
            <div className="mb-12">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
            </div>

            <nav className="flex-1 flex flex-col gap-6 w-full px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center justify-center p-3 rounded-xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-6 h-6" strokeWidth={1.5} />
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-l-full blur-[2px]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="w-full px-4 mb-4">
                <LoginButton />
            </div>
        </aside>
    );
}
