'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, 
    BookOpen, 
    History, 
    Settings, 
    FileText, 
    LogOut, 
    GraduationCap,
    User
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'GPA Calculator', icon: BookOpen, href: '/dashboard/calculator' },
    { name: 'CGPA History', icon: History, href: '/dashboard/history' },
    { name: 'Transcript', icon: FileText, href: '/dashboard/transcript' },
    { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <aside className="w-72 bg-dark-surface/50 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0 flex flex-col p-6">
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <GraduationCap className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold font-outfit tracking-tight">NaijaCGPA<span className="text-primary">.</span></span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive 
                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "group-hover:text-primary")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-danger/10 hover:text-danger transition-all duration-300 group mt-auto"
            >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
            </button>
        </aside>
    );
}
