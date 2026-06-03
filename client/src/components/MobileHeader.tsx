'use client';

import { GraduationCap, Menu, User } from 'lucide-react';
import Link from 'next/link';

interface MobileHeaderProps {
    user: any;
    onMenuOpen: () => void;
}

export default function MobileHeader({ user, onMenuOpen }: MobileHeaderProps) {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
            {/* Hamburger */}
            <button
                id="mobile-menu-btn"
                onClick={onMenuOpen}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-95"
                aria-label="Open menu"
            >
                <Menu size={22} className="text-gray-300" />
            </button>

            {/* Centered Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                    <GraduationCap className="text-white" size={18} />
                </div>
                <span className="text-lg font-bold font-outfit tracking-tight">
                    Spice<span className="text-primary">CGPA</span>
                </span>
            </Link>

            {/* Profile Avatar */}
            <Link
                href="/dashboard/profile"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg border-2 border-white/10 overflow-hidden active:scale-95 transition-transform"
            >
                {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User size={18} className="text-white" />
                )}
            </Link>
        </header>
    );
}
