'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { resultService, courseService } from '@/services/api';
import { 
    History, 
    Calendar, 
    ChevronDown, 
    ChevronUp, 
    BookOpen, 
    Award,
    Loader2,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
    const { data: results, isLoading } = useQuery({
        queryKey: ['all-results'],
        queryFn: async () => {
            const { data } = await resultService.getResults();
            return data;
        }
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-extrabold font-outfit mb-2">Academic History</h1>
                    <p className="text-gray-400">View your performance across all semesters.</p>
                </div>

                <div className="space-y-6">
                    {results?.length > 0 ? (
                        results.map((result: any, index: number) => (
                            <SemesterCard key={index} result={result} index={index} />
                        ))
                    ) : (
                        <div className="glass-card text-center py-20">
                            <History size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No academic history found yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function SemesterCard({ result, index }: { result: any, index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ['courses', result.session, result.semester],
        queryFn: async () => {
            const { data } = await courseService.getCourses({ 
                session: result.session, 
                semester: result.semester 
            });
            return data;
        },
        enabled: isExpanded
    });

    const getStandingColor = (standing: string) => {
        if (standing === 'First Class') return 'text-primary';
        if (standing === 'Second Class Upper') return 'text-secondary';
        if (standing === 'Probation') return 'text-danger';
        return 'text-warning';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card !p-0 overflow-hidden"
        >
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{result.semester} Semester</h3>
                        <p className="text-sm text-gray-500">{result.session} Session</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1">GPA</p>
                        <p className="text-2xl font-black text-primary">{result.gpa.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1">Standing</p>
                        <p className={`text-sm font-bold ${getStandingColor(result.academicStanding)}`}>{result.academicStanding}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1">Units</p>
                        <p className="text-sm font-bold">{result.totalUnits}</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                    >
                        <div className="p-6">
                            {coursesLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin text-primary" size={24} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-gray-500 tracking-widest px-4">
                                        <div className="col-span-2">Code</div>
                                        <div className="col-span-6">Title</div>
                                        <div className="col-span-2 text-center">Units</div>
                                        <div className="col-span-2 text-center">Grade</div>
                                    </div>
                                    {courses?.map((course: any, i: number) => (
                                        <div key={i} className="grid grid-cols-12 bg-white/5 p-4 rounded-xl items-center">
                                            <div className="col-span-2 font-mono text-xs">{course.code}</div>
                                            <div className="col-span-6 font-semibold text-sm">{course.title}</div>
                                            <div className="col-span-2 text-center text-sm">{course.unit}</div>
                                            <div className="col-span-2 text-center">
                                                <span className={`px-2 py-1 rounded-md font-bold text-xs ${
                                                    course.grade === 'A' ? 'bg-primary/20 text-primary' : 
                                                    course.grade === 'F' ? 'bg-danger/20 text-danger' : 
                                                    'bg-white/10 text-white'
                                                }`}>
                                                    {course.grade}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!courses || courses.length === 0) && (
                                        <p className="text-center text-gray-500 py-4 italic">No course details found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
