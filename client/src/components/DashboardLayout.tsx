'use client';

import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import MobileDrawer from './MobileDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            // Try to fetch profile from backend (which now defaults to a guest user)
            fetch(`${apiBase}/users/profile`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            })

            .then(res => res.json())
            .then(data => {
                if (data && data._id) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                }
            })
            .catch(err => console.error('Failed to fetch profile:', err));
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-[#0f172a] text-white">
            {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* ─── Mobile Navigation (hidden on desktop) ─── */}
            <MobileHeader user={user} onMenuOpen={() => setDrawerOpen(true)} />
            <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
            <MobileBottomNav />

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col">
                {/* Desktop Top Header */}
                <header className="hidden md:flex h-20 border-b border-white/5 items-center justify-between px-10 bg-dark-surface/30 backdrop-blur-md sticky top-0 z-40">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search courses, semesters..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                            <Bell size={20} className="text-gray-400" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
                        </button>
                        
                        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold">{user?.fullName || 'Student'}</p>
                                <p className="text-xs text-gray-500">{user?.matricNumber || 'U2023/...'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg border-2 border-white/10 overflow-hidden">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                {/* pt-16 on mobile = clears the sticky top header; pb-28 = clears bottom nav */}
                <main className="p-10 flex-1 overflow-y-auto pt-16 md:pt-10 pb-28 md:pb-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
