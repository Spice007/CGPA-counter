'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    BookOpen,
    History,
    FileText,
    User,
    Settings,
    LogOut,
    GraduationCap,
    X,
    Calculator
} from 'lucide-react';

const drawerItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'GPA Calculator', icon: Calculator, href: '/dashboard/calculator' },
    { name: 'CGPA History', icon: History, href: '/dashboard/history' },
    { name: 'Transcript', icon: FileText, href: '/dashboard/transcript' },
    { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export default function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Drawer Panel */}
                    <motion.aside
                        key="drawer"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-72 bg-[#1e293b]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                    <GraduationCap className="text-white" size={20} />
                                </div>
                                <span className="text-lg font-bold font-outfit">
                                    Spice<span className="text-primary">CGPA</span>
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div className="px-5 py-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center overflow-hidden border-2 border-white/10 flex-shrink-0">
                                        {user.profilePicture ? (
                                            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} className="text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm truncate">{user.fullName || 'Student'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.department || user.matricNumber || ''}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {drawerItems.map((item, i) => {
                                const isActive = pathname === item.href;
                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                                            <span className="font-medium text-sm">{item.name}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                            >
                                <LogOut size={20} />
                                <span className="font-medium text-sm">Logout</span>
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
