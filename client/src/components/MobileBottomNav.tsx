'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Plus, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Courses', icon: BookOpen, href: '/dashboard/history' },
    { name: '', icon: Plus, href: '/dashboard/calculator', isFab: true },
    { name: 'History', icon: History, href: '/dashboard/transcript' },
    { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe">
            <div className="mb-4 bg-[#1e293b]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.isFab) {
                        return (
                            <Link key="fab" href={item.href} id="mobile-add-fab">
                                <motion.div
                                    whileTap={{ scale: 0.88 }}
                                    className="w-14 h-14 -mt-6 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-xl shadow-primary/40 border-2 border-white/10"
                                >
                                    <Plus size={26} className="text-white" strokeWidth={2.5} />
                                </motion.div>
                            </Link>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center gap-1 py-1 relative">
                            <motion.div
                                whileTap={{ scale: 0.85 }}
                                className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-gray-500'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute -top-2 w-8 h-1 bg-primary rounded-full shadow-lg shadow-primary/50"
                                        transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                                    />
                                )}
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                                    {item.name}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
