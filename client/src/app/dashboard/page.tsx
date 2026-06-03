'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { resultService } from '@/services/api';
import { 
    TrendingUp, 
    BookOpen, 
    Award, 
    Calendar,
    ChevronRight,
    Plus,
    Layers,
    FileText,
    Image as ImageIcon,
    Download,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function getStandingColor(s: string) {
    if (s === 'First Class') return 'text-emerald-400';
    if (s === 'Second Class Upper') return 'text-blue-400';
    if (s === 'Second Class Lower') return 'text-yellow-400';
    if (s === 'Probation') return 'text-red-400';
    return 'text-gray-400';
}

function getProgressWidth(gpa: number) {
    return `${Math.min((gpa / 5) * 100, 100)}%`;
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const { data: cgpaData, isLoading } = useQuery({
        queryKey: ['cgpa-summary'],
        queryFn: async () => {
            const { data } = await resultService.getCGPA();
            return data;
        }
    });

    const { data: recentResults } = useQuery({
        queryKey: ['recent-results'],
        queryFn: async () => {
            const { data } = await resultService.getResults();
            return data;
        }
    });

    const { data: levelResults } = useQuery({
        queryKey: ['level-results'],
        queryFn: async () => {
            const { data } = await resultService.getLevels();
            return data;
        }
    });

    const chartData = recentResults?.map((r: any) => ({
        name: `${r.semester} ${r.session}`,
        gpa: r.gpa
    })).reverse() || [];

    // Export PDF
    const handleExportPDF = () => {
        toast.loading('Generating PDF…');
        setTimeout(() => {
            toast.dismiss();
            // Build printable content
            const printContent = `
                <html>
                <head>
                    <title>SpiceCGPA Academic Transcript</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; background: #fff; color: #111; }
                        h1 { font-size: 24px; margin-bottom: 4px; }
                        .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
                        .stat { display: inline-block; margin-right: 40px; margin-bottom: 24px; }
                        .stat-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
                        .stat-value { font-size: 32px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #999; padding: 8px 12px; border-bottom: 2px solid #eee; }
                        td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
                        .footer { margin-top: 48px; font-size: 12px; color: #aaa; text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>SpiceCGPA Academic Transcript</h1>
                    <p class="subtitle">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div>
                        <div class="stat">
                            <div class="stat-label">Cumulative CGPA</div>
                            <div class="stat-value">${cgpaData?.cgpa || '—'}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Total Units</div>
                            <div class="stat-value">${cgpaData?.totalUnits || '—'}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Grade Points</div>
                            <div class="stat-value">${cgpaData?.totalPoints || '—'}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Standing</div>
                            <div class="stat-value" style="font-size:20px">${cgpaData?.standing || '—'}</div>
                        </div>
                    </div>
                    ${recentResults && recentResults.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Semester</th>
                                <th>GPA</th>
                                <th>Units</th>
                                <th>Standing</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentResults.map((r: any) => `
                                <tr>
                                    <td>${r.session}</td>
                                    <td>${r.semester}</td>
                                    <td><strong>${r.gpa?.toFixed(2)}</strong></td>
                                    <td>${r.totalUnits}</td>
                                    <td>${r.academicStanding || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : '<p style="color:#999;margin-top:24px">No semester results recorded yet.</p>'}
                    <div class="footer">SpiceCGPA • Academic Performance Tracker</div>
                </body>
                </html>
            `;
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(printContent);
                win.document.close();
                win.print();
            }
        }, 800);
    };

    // Save as Image (screenshot via canvas)
    const dashboardRef = useRef<HTMLDivElement>(null);
    const handleSaveImage = async () => {
        try {
            toast.loading('Capturing dashboard…');
            // Use html2canvas if available, otherwise fall back to a styled snapshot
            const html2canvas = (await import('html2canvas' as any)).default;
            const canvas = await html2canvas(dashboardRef.current!, {
                backgroundColor: '#0f172a',
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = 'spicecgpa-dashboard.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.dismiss();
            toast.success('Image saved!');
        } catch {
            toast.dismiss();
            // Fallback: generate a styled summary image via Canvas API
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 450;
            const ctx = canvas.getContext('2d')!;
            // Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 800, 450);
            // Gradient overlay
            const grad = ctx.createLinearGradient(0, 0, 800, 450);
            grad.addColorStop(0, 'rgba(16,185,129,0.12)');
            grad.addColorStop(1, 'rgba(99,102,241,0.08)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 450);
            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('SpiceCGPA Academic Summary', 48, 64);
            // CGPA
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 72px Arial';
            ctx.fillText(cgpaData?.cgpa || '0.00', 48, 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Arial';
            ctx.fillText('Cumulative GPA', 48, 210);
            // Standing
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(cgpaData?.standing || '—', 48, 270);
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.fillText('Academic Standing', 48, 296);
            // Units
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.fillText(String(cgpaData?.totalUnits || '0'), 360, 180);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px Arial';
            ctx.fillText('Total Credit Units', 360, 204);
            // Footer
            ctx.fillStyle = '#475569';
            ctx.font = '12px Arial';
            ctx.fillText(`Generated ${new Date().toLocaleDateString()} • SpiceCGPA`, 48, 420);
            const link = document.createElement('a');
            link.download = 'spicecgpa-summary.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Summary image saved!');
        }
    };

    return (
        <DashboardLayout>
            <div ref={dashboardRef}>
                {/* ════════════════════════════════════════════
                    DESKTOP LAYOUT (≥ 768px) — unchanged
                ════════════════════════════════════════════ */}
                <div className="hidden md:block space-y-8">
                    {/* Welcome Section */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-extrabold font-outfit mb-2">Academic Overview</h1>
                            <p className="text-gray-400">Track your progress and academic standing.</p>
                        </div>
                        <Link href="/dashboard/calculator" className="btn-primary flex items-center gap-2">
                            <Plus size={20} /> Add New Semester
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Cumulative CGPA" 
                            value={cgpaData?.cgpa || '0.00'} 
                            subValue={cgpaData?.standing || 'N/A'}
                            icon={<Award className="text-primary" />}
                            trend="+0.12 from last semester"
                        />
                        <StatCard 
                            title="Total Credit Units" 
                            value={cgpaData?.totalUnits || '0'} 
                            subValue="Across all levels"
                            icon={<BookOpen className="text-secondary" />}
                        />
                        <StatCard 
                            title="Grade Points" 
                            value={cgpaData?.totalPoints || '0'} 
                            subValue="Weighted sum"
                            icon={<TrendingUp className="text-accent" />}
                        />
                        <StatCard 
                            title="Current Standing" 
                            value={cgpaData?.standing || 'Probation'} 
                            subValue="Class of degree"
                            icon={<Award className="text-warning" />}
                        />
                    </div>

                    {/* Charts and Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-card h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">GPA Progression</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Calendar size={16} /> Last 5 Semesters
                                </div>
                            </div>
                            <div className="w-full h-full pb-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0, 5]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#10b981' }}
                                        />
                                        <Area type="monotone" dataKey="gpa" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card">
                            <h3 className="text-xl font-bold mb-6">Recent Results</h3>
                            <div className="space-y-4">
                                {recentResults?.slice(0, 5).map((result: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {result.gpa}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{result.semester} Semester</p>
                                                <p className="text-xs text-gray-500">{result.session}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                ))}
                                {(!recentResults || recentResults.length === 0) && (
                                    <p className="text-center text-gray-500 py-10">No results found yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Level Performance Section */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="glass-card">
                            <div className="flex items-center gap-2 mb-6">
                                <Layers className="text-secondary" />
                                <h3 className="text-xl font-bold">Level Performance (Session GPA)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {levelResults?.map((level: any, i: number) => (
                                    <div key={i} className="flex flex-col p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer border border-white/5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-semibold text-lg">{level.session} Session</p>
                                                <p className="text-xs text-gray-400 mt-1">{level.totalUnits} Units • {level.totalPoints} Points</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-bold text-lg">
                                                {level.gpa}
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">Standing</span>
                                                <span className="font-semibold text-white">{level.standing}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!levelResults || levelResults.length === 0) && (
                                    <p className="text-center text-gray-500 py-10 col-span-full">No level results calculated yet. Add courses for a session to see your Level GPA.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════
                    MOBILE LAYOUT (< 768px) — brand new
                ════════════════════════════════════════════ */}
                <div className="md:hidden space-y-5">

                    {/* ── Welcome Card ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-white/10 p-5"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.1) 100%)' }}
                    >
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                        <p className="text-sm text-gray-400 font-medium mb-1">👋 {getGreeting()}</p>
                        <h2 className="text-2xl font-extrabold font-outfit mb-0.5">{user?.fullName?.split(' ')[0] || 'Student'}</h2>
                        <p className="text-sm text-gray-400">{user?.department || 'Your Department'}</p>
                        {user?.matricNumber && <p className="text-xs text-gray-600 mt-0.5">{user.matricNumber}</p>}
                    </motion.div>

                    {/* ── KPI Carousel ── */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Overview</p>
                        <div className="overflow-x-auto flex gap-3 pb-2 snap-x snap-mandatory scroll-px-0 -mx-4 px-4 scrollbar-none">
                            {[
                                {
                                    label: 'Current CGPA',
                                    value: cgpaData?.cgpa || '—',
                                    sub: cgpaData?.standing || 'N/A',
                                    color: '#10b981',
                                    bg: 'rgba(16,185,129,0.12)',
                                },
                                {
                                    label: 'Total Units',
                                    value: cgpaData?.totalUnits || '—',
                                    sub: 'Credit hours',
                                    color: '#6366f1',
                                    bg: 'rgba(99,102,241,0.12)',
                                },
                                {
                                    label: 'Grade Points',
                                    value: cgpaData?.totalPoints || '—',
                                    sub: 'Weighted total',
                                    color: '#8b5cf6',
                                    bg: 'rgba(139,92,246,0.12)',
                                },
                                {
                                    label: 'Academic Standing',
                                    value: cgpaData?.standing ? cgpaData.standing.split(' ').map((w: string) => w[0]).join('') : '—',
                                    sub: cgpaData?.standing || 'N/A',
                                    color: '#f59e0b',
                                    bg: 'rgba(245,158,11,0.12)',
                                },
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="snap-start flex-shrink-0 w-44 rounded-2xl border border-white/10 p-4"
                                    style={{ background: card.bg }}
                                >
                                    <p className="text-xs text-gray-400 font-semibold mb-2">{card.label}</p>
                                    <p className="text-4xl font-black font-outfit mb-1" style={{ color: card.color }}>{card.value}</p>
                                    <p className="text-xs text-gray-500 truncate">{card.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ── Quick Actions 2×2 grid ── */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Add Course', icon: Plus, href: '/dashboard/calculator', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                                { label: 'Add Semester', icon: Calendar, href: '/dashboard/calculator', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
                                { label: 'Export PDF', icon: FileText, onClick: handleExportPDF, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                                { label: 'Save Image', icon: ImageIcon, onClick: handleSaveImage, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                            ].map((action, i) => {
                                const Icon = action.icon;
                                const inner = (
                                    <motion.div
                                        whileTap={{ scale: 0.94 }}
                                        className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-white/10 cursor-pointer active:brightness-90 transition-all"
                                        style={{ background: action.bg }}
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: action.color + '25' }}>
                                            <Icon size={20} style={{ color: action.color }} />
                                        </div>
                                        <p className="text-sm font-bold">{action.label}</p>
                                    </motion.div>
                                );
                                return action.href ? (
                                    <Link key={i} href={action.href}>{inner}</Link>
                                ) : (
                                    <div key={i} onClick={action.onClick}>{inner}</div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Academic Standing Card ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-emerald-500/20 p-5 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.05) 100%)' }}
                    >
                        <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-2 mb-3">
                            <Award size={18} className="text-primary" />
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">Academic Standing</p>
                        </div>
                        <p className="text-2xl font-extrabold font-outfit mb-1">{cgpaData?.standing || '—'}</p>
                        <div className="flex gap-6 mt-3">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Current CGPA</p>
                                <p className="text-lg font-bold text-primary">{cgpaData?.cgpa || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Target</p>
                                <p className="text-lg font-bold text-gray-300">4.50+</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Level Breakdown ── */}
                    {levelResults && levelResults.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers size={18} className="text-secondary" />
                                <p className="font-bold text-sm">Level Breakdown</p>
                            </div>
                            <div className="space-y-4">
                                {levelResults.map((level: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-sm font-semibold">{level.session} Session</p>
                                            <p className="text-sm font-bold text-primary">{Number(level.gpa).toFixed(2)}</p>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: getProgressWidth(Number(level.gpa)) }}
                                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{level.totalUnits} units • {level.standing}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Semester Accordion ── */}
                    {recentResults && recentResults.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Semesters</p>
                            <div className="space-y-3">
                                {recentResults.map((result: any, i: number) => (
                                    <MobileSemesterCard key={i} result={result} index={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Performance Chart ── */}
                    {chartData.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-primary" />
                                <p className="font-bold text-sm">Performance Trend</p>
                            </div>
                            <div className="overflow-x-auto -mx-2">
                                <div style={{ minWidth: Math.max(chartData.length * 80, 300) }} className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 0, right: 16 }}>
                                            <defs>
                                                <linearGradient id="mobileColorGpa" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis domain={[0, 5]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={28} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12 }}
                                                itemStyle={{ color: '#10b981' }}
                                            />
                                            <Area type="monotone" dataKey="gpa" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#mobileColorGpa)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {(!recentResults || recentResults.length === 0) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Zap size={28} className="text-primary" />
                            </div>
                            <p className="font-bold mb-1">No data yet</p>
                            <p className="text-sm text-gray-500 mb-4">Add your first semester to see your academic overview here.</p>
                            <Link href="/dashboard/calculator" className="btn-primary inline-flex items-center gap-2 text-sm">
                                <Plus size={16} /> Add First Semester
                            </Link>
                        </motion.div>
                    )}

                    {/* FAB */}
                    <Link href="/dashboard/calculator" id="dashboard-fab">
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-2xl shadow-primary/40 border border-white/10 z-40"
                        >
                            <Plus size={26} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ─── Desktop Stat Card ──────────────────────────────────────────────────────
function StatCard({ title, value, subValue, icon, trend }: any) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="glass-card relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
            <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
            <h2 className="text-3xl font-extrabold font-outfit mb-1">{value}</h2>
            <p className="text-xs text-primary font-semibold">{subValue}</p>
            {trend && <p className="text-[10px] text-gray-500 mt-4">{trend}</p>}
        </motion.div>
    );
}

// ─── Mobile Semester Accordion Card ────────────────────────────────────────
function MobileSemesterCard({ result, index }: { result: any; index: number }) {
    const [open, setOpen] = useState(false);

    const getGradeColor = (grade: string) => {
        if (grade === 'A') return 'bg-emerald-500/20 text-emerald-400';
        if (grade === 'B') return 'bg-blue-500/20 text-blue-400';
        if (grade === 'F') return 'bg-red-500/20 text-red-400';
        return 'bg-white/10 text-gray-300';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 text-left active:bg-white/5 transition-colors"
            >
                <div>
                    <p className="font-bold text-sm">{result.semester} Semester • {result.session}</p>
                    <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-500">GPA: <span className="text-primary font-bold">{result.gpa?.toFixed(2)}</span></span>
                        <span className="text-xs text-gray-500">{result.totalUnits} Units</span>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"
                >
                    <ChevronRight size={16} className="text-gray-400 rotate-90" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                            {result.courses?.map((course: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-xs font-mono text-gray-400">{course.code}</p>
                                        <p className="text-sm font-semibold">{course.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-gray-500">{course.unit}u</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getGradeColor(course.grade)}`}>
                                            {course.grade}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!result.courses?.length && (
                                <p className="text-xs text-gray-600 text-center py-2">No course details available. View in History.</p>
                            )}
                            <Link
                                href="/dashboard/history"
                                className="flex items-center justify-center gap-1.5 w-full mt-2 py-2.5 rounded-xl bg-white/5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <BookOpen size={14} /> View Full Details
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
