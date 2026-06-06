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
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function DashboardPage() {
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

    return (
        <DashboardLayout>
            <div className="space-y-8">
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
        </DashboardLayout>
    );
}

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
