'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    Plus, 
    Trash2, 
    Save, 
    Calculator as CalcIcon, 
    Info,
    RefreshCcw,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { courseService, resultService } from '@/services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CourseForm {
    title: string;
    code: string;
    unit: number;
    grade: string;
}

const GRADE_COLORS: Record<string, string> = {
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-white',
    D: 'text-yellow-400',
    E: 'text-orange-400',
    F: 'text-red-400',
};

export default function CalculatorPage() {
    const [session, setSession] = useState('2023/2024');
    const [semester, setSemester] = useState('First');
    const [courses, setCourses] = useState<CourseForm[]>([
        { title: '', code: '', unit: 3, grade: 'A' }
    ]);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const addCourseRow = () => {
        setCourses([...courses, { title: '', code: '', unit: 3, grade: 'A' }]);
    };

    const removeCourseRow = (index: number) => {
        const newCourses = courses.filter((_, i) => i !== index);
        setCourses(newCourses);
    };

    const handleCourseChange = (index: number, field: keyof CourseForm, value: any) => {
        const newCourses = [...courses];
        newCourses[index] = { ...newCourses[index], [field]: value };
        setCourses(newCourses);
    };

    const calculateLocalGPA = () => {
        let totalUnits = 0;
        let totalPoints = 0;
        const gradeScale: any = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };

        courses.forEach(c => {
            totalUnits += Number(c.unit);
            totalPoints += (Number(c.unit) * gradeScale[c.grade]);
        });

        return totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : '0.00';
    };

    const handleSubmit = async () => {
        if (courses.some(c => !c.title || !c.code)) {
            toast.error('Please fill in all course details');
            return;
        }

        setLoading(true);
        try {
            await Promise.all(courses.map(course => 
                courseService.addCourse({ ...course, semester, session })
            ));
            await resultService.calculateGPA({ semester, session });

            toast.success('Semester results saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['cgpa-summary'] });
            queryClient.invalidateQueries({ queryKey: ['recent-results'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save results');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold font-outfit mb-1 md:mb-2">GPA Calculator</h1>
                        <p className="text-gray-400 text-sm md:text-base">Add your courses for the current semester.</p>
                    </div>

                    {/* Session / Semester selector */}
                    <div className="flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 w-full md:w-auto">
                        <select 
                            value={session} 
                            onChange={(e) => setSession(e.target.value)}
                            className="bg-transparent text-sm font-semibold p-2 focus:outline-none flex-1 md:flex-none"
                        >
                            <option value="2023/2024">2023/2024</option>
                            <option value="2022/2023">2022/2023</option>
                        </select>
                        <div className="w-px h-6 bg-white/10 self-center" />
                        <select 
                            value={semester} 
                            onChange={(e) => setSemester(e.target.value)}
                            className="bg-transparent text-sm font-semibold p-2 focus:outline-none flex-1 md:flex-none"
                        >
                            <option value="First">First Semester</option>
                            <option value="Second">Second Semester</option>
                        </select>
                    </div>
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden md:block glass-card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course Title</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course Code</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Units</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Grade</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {courses.map((course, index) => (
                                        <motion.tr 
                                            key={index}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Introduction to Computing"
                                                    className="bg-transparent border-none w-full focus:ring-0 text-sm group-hover:placeholder:text-gray-400 transition-all"
                                                    value={course.title}
                                                    onChange={(e) => handleCourseChange(index, 'title', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="CSC 101"
                                                    className="bg-transparent border-none w-full focus:ring-0 text-sm font-mono uppercase"
                                                    value={course.code}
                                                    onChange={(e) => handleCourseChange(index, 'code', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                    value={course.unit}
                                                    onChange={(e) => handleCourseChange(index, 'unit', Number(e.target.value))}
                                                >
                                                    {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={u} className="bg-dark-surface">{u}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    className={cn(
                                                        "bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold cursor-pointer transition-colors",
                                                        course.grade === 'A' ? 'text-primary' : course.grade === 'F' ? 'text-danger' : 'text-white'
                                                    )}
                                                    value={course.grade}
                                                    onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                                                >
                                                    <option value="A" className="bg-dark-surface text-primary">A (5.0)</option>
                                                    <option value="B" className="bg-dark-surface text-secondary">B (4.0)</option>
                                                    <option value="C" className="bg-dark-surface text-white">C (3.0)</option>
                                                    <option value="D" className="bg-dark-surface text-warning">D (2.0)</option>
                                                    <option value="E" className="bg-dark-surface text-orange-400">E (1.0)</option>
                                                    <option value="F" className="bg-dark-surface text-danger">F (0.0)</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => removeCourseRow(index)}
                                                    className="p-2 text-gray-400 hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={addCourseRow}
                                className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors bg-primary/10 px-4 py-2 rounded-xl"
                            >
                                <Plus size={18} /> Add Course
                            </button>
                            
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-white/5">
                                <span>A: {courses.filter(c => c.grade === 'A').length}</span>
                                <div className="w-px h-3 bg-white/10" />
                                <span>B: {courses.filter(c => c.grade === 'B').length}</span>
                                <div className="w-px h-3 bg-white/10" />
                                <span>C-E: {courses.filter(c => ['C', 'D', 'E'].includes(c.grade)).length}</span>
                                <div className="w-px h-3 bg-white/10" />
                                <span className="text-danger">F: {courses.filter(c => c.grade === 'F').length}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Expected GPA</p>
                                <motion.p 
                                    key={calculateLocalGPA()}
                                    initial={{ scale: 1.2, color: '#10b981' }}
                                    animate={{ scale: 1, color: '#10b981' }}
                                    className="text-4xl font-extrabold text-primary font-outfit"
                                >
                                    {calculateLocalGPA()}
                                </motion.p>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 !px-8 py-3 min-w-[180px] justify-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Semester</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile Card List ── */}
                <div className="md:hidden space-y-3">
                    {/* GPA Preview pill */}
                    <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20">
                        <span className="text-sm font-semibold text-gray-300">Expected GPA</span>
                        <motion.span
                            key={calculateLocalGPA()}
                            initial={{ scale: 1.15 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-black text-primary font-outfit"
                        >
                            {calculateLocalGPA()}
                        </motion.span>
                    </div>

                    {/* Course cards */}
                    <AnimatePresence initial={false} mode="popLayout">
                        {courses.map((course, index) => (
                            <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3"
                            >
                                {/* Card header */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Course {index + 1}</span>
                                    <button
                                        onClick={() => removeCourseRow(index)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 active:scale-90 transition-transform"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Course Title */}
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-semibold">Course Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Introduction to Computing"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-gray-600"
                                        value={course.title}
                                        onChange={(e) => handleCourseChange(index, 'title', e.target.value)}
                                    />
                                </div>

                                {/* Code / Unit / Grade row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-xs text-gray-500 font-semibold">Code</label>
                                        <input
                                            type="text"
                                            placeholder="CSC101"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-gray-600"
                                            value={course.code}
                                            onChange={(e) => handleCourseChange(index, 'code', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 font-semibold">Units</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
                                            value={course.unit}
                                            onChange={(e) => handleCourseChange(index, 'unit', Number(e.target.value))}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(u => <option key={u} value={u} className="bg-[#1e293b]">{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 font-semibold">Grade</label>
                                        <select
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none",
                                                GRADE_COLORS[course.grade] || 'text-white'
                                            )}
                                            value={course.grade}
                                            onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                                        >
                                            <option value="A" className="bg-[#1e293b]">A (5.0)</option>
                                            <option value="B" className="bg-[#1e293b]">B (4.0)</option>
                                            <option value="C" className="bg-[#1e293b]">C (3.0)</option>
                                            <option value="D" className="bg-[#1e293b]">D (2.0)</option>
                                            <option value="E" className="bg-[#1e293b]">E (1.0)</option>
                                            <option value="F" className="bg-[#1e293b]">F (0.0)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Course button */}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={addCourseRow}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/20 text-sm font-semibold text-gray-400 hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                        <Plus size={18} />
                        Add Another Course
                    </motion.button>

                    {/* Grade summary */}
                    <div className="flex items-center justify-center gap-4 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(g => {
                            const count = courses.filter(c => c.grade === g).length;
                            return count > 0 ? (
                                <div key={g} className="flex items-center gap-1">
                                    <span className={`text-xs font-bold ${GRADE_COLORS[g]}`}>{g}</span>
                                    <span className="text-xs text-gray-600">×{count}</span>
                                </div>
                            ) : null;
                        })}
                    </div>

                    {/* Full-width save button */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-white font-bold text-base shadow-xl shadow-primary/25 active:brightness-90 transition-all disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Semester</>}
                    </motion.button>
                </div>

                {/* Info cards — shared across desktop & mobile */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <div className="glass-card flex gap-4 border-l-4 border-info">
                        <div className="p-3 bg-info/10 rounded-xl h-fit">
                            <Info size={24} className="text-info" />
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">How it works</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                We use the standard Nigerian 5-point system. GPA is calculated by dividing total quality points by total credit units.
                            </p>
                        </div>
                    </div>
                    
                    <div className="glass-card flex gap-4 border-l-4 border-warning">
                        <div className="p-3 bg-warning/10 rounded-xl h-fit">
                            <RefreshCcw size={24} className="text-warning" />
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">GPA Prediction</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                You can play with grades to see how they affect your overall CGPA before saving them to your permanent record.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
