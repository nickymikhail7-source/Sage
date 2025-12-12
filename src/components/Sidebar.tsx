'use client';

import { Inbox, Calendar, Users, Send, Settings, Leaf } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LoginButton } from './LoginButton';

const navItems = [
    { icon: Inbox, label: 'Inbox', href: '/', badge: 0 },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Users, label: 'Contacts', href: '/contacts' },
    { icon: Send, label: 'Sequences', href: '/sequences' },
];

export function Sidebar() {
    return (
        <nav className="w-16 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 flex-shrink-0 z-50">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-8">
                <Leaf className="w-5 h-5 text-emerald-500" />
            </div>

            {/* Navigation items */}
            <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
                {navItems.map((item) => (
                    <NavItem key={item.href} item={item} />
                ))}
            </div>

            {/* Login / Settings */}
            <div className="flex flex-col gap-4 items-center mb-4">
                {/* Reusing LoginButton logic but minimal style */}
                <div className="scale-75 origin-bottom">
                    <LoginButton />
                </div>

                <button className="w-10 h-10 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}

function NavItem({ item }: { item: any }) {
    const pathname = usePathname();
    const isActive = pathname === item.href;

    return (
        <Link
            href={item.href}
            className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors
        ${isActive
                    ? 'bg-zinc-800 text-emerald-500'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }
      `}
            title={item.label}
        >
            <item.icon className="w-5 h-5" />

            {/* Badge for unread count */}
            {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}
        </Link>
    );
}
