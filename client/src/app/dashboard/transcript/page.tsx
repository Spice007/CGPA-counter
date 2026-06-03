'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { courseService, resultService, userService } from '@/services/api';
import { 
    Download, 
    Printer, 
    FileText, 
    GraduationCap,
    CheckCircle2,
    Calendar,
    User as UserIcon,
    School
} from 'lucide-react';
import { useRef } from 'react';
import toast from 'react-hot-toast';

export default function TranscriptPage() {
    const transcriptRef = useRef<HTMLDivElement>(null);

    const { data: user } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data } = await userService.getProfile();
            return data;
        }
    });

    const { data: results } = useQuery({
        queryKey: ['all-results'],
        queryFn: async () => {
            const { data } = await resultService.getResults();
            return data;
        }
    });

    const { data: cgpaData } = useQuery({
        queryKey: ['cgpa-data'],
        queryFn: async () => {
            const { data } = await resultService.getCGPA();
            return data;
        }
    });

    const { data: allCourses } = useQuery({
        queryKey: ['all-courses'],
        queryFn: async () => {
            const { data } = await courseService.getCourses();
            return data;
        }
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        toast.loading('Generating PDF...');
        setTimeout(() => {
            toast.dismiss();
            window.print();
        }, 1000);
    };

    const getCoursesForSemester = (session: string, semester: string) => {
        return allCourses?.filter((c: any) => c.session === session && c.semester === semester) || [];
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center no-print">
                    <div>
                        <h1 className="text-4xl font-extrabold font-outfit mb-2">Academic Transcript</h1>
                        <p className="text-gray-400">Generate and download your official result summary.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handlePrint} className="glass-card !py-3 !px-6 flex items-center gap-2 hover:bg-white/10">
                            <Printer size={20} /> Print
                        </button>
                        <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2 !px-8">
                            <Download size={20} /> Export PDF
                        </button>
                    </div>
                </div>

                {/* Transcript Document Preview */}
                <div 
                    ref={transcriptRef}
                    className="bg-white text-gray-900 rounded-3xl p-12 shadow-2xl min-h-[1000px] print:shadow-none print:p-8"
                >
                    {/* Document Header */}
                    <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                                <GraduationCap className="text-white" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Transcript</h2>
                                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Naija CGPA Pro Verification System</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm">Issue Date</p>
                            <p className="text-lg font-black">{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Student Info Grid */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-4">
                            <InfoRow icon={<UserIcon size={16}/>} label="Full Name" value={user?.fullName || '---'} />
                            <InfoRow icon={<School size={16}/>} label="Institution" value={user?.faculty || '---'} />
                            <InfoRow icon={<FileText size={16}/>} label="Matric Number" value={user?.matricNumber || '---'} />
                        </div>
                        <div className="space-y-4">
                            <InfoRow icon={<Calendar size={16}/>} label="Department" value={user?.department || '---'} />
                            <InfoRow icon={<CheckCircle2 size={16}/>} label="Academic Standing" value={cgpaData?.standing || '---'} />
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-gray-400">Cumulative CGPA</span>
                                <span className="text-4xl font-black text-gray-900">{cgpaData?.cgpa || '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="space-y-12">
                        {results?.map((res: any, idx: number) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-lg font-black uppercase border-b-2 border-gray-200 pb-2 flex justify-between">
                                    <span>{res.semester} Semester | {res.session}</span>
                                    <span className="text-gray-400 font-bold">GPA: {res.gpa.toFixed(2)}</span>
                                </h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                                            <th className="pb-4">Course Code</th>
                                            <th className="pb-4">Course Title</th>
                                            <th className="pb-4 text-center">Unit</th>
                                            <th className="pb-4 text-center">Grade</th>
                                            <th className="pb-4 text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {getCoursesForSemester(res.session, res.semester).map((course: any, cIdx: number) => (
                                            <tr key={cIdx} className="group">
                                                <td className="py-3 font-bold font-mono text-xs">{course.code}</td>
                                                <td className="py-3">{course.title}</td>
                                                <td className="py-3 text-center">{course.unit}</td>
                                                <td className="py-3 text-center font-bold">{course.grade}</td>
                                                <td className="py-3 text-right font-bold">{course.gradePoint * course.unit}</td>
                                            </tr>
                                        ))}
                                        {getCoursesForSemester(res.session, res.semester).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-gray-400 italic text-xs">No course data available for this semester.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold text-gray-900 border-t border-gray-200">
                                            <td colSpan={2} className="py-4 uppercase text-[10px] tracking-wider text-gray-400">Semester Summary</td>
                                            <td className="py-4 text-center">Units: {res.totalUnits}</td>
                                            <td colSpan={2} className="py-4 text-right">Total Points: {res.totalPoints}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ))}
                        {(!results || results.length === 0) && (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No academic results recorded</p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Auth */}
                    <div className="mt-20 pt-12 border-t border-gray-100 flex justify-between items-end italic text-gray-400 text-xs">
                        <div>
                            <p>This is a computer-generated transcript.</p>
                            <p>Verification Key: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <div className="w-32 h-1 bg-gray-900 mb-2 ml-auto" />
                            <p className="font-bold uppercase not-italic text-gray-900">Registrar Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                    .main-content { padding: 0 !important; }
                    header, aside { display: none !important; }
                }
            `}</style>
        </DashboardLayout>
    );
}

function InfoRow({ icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-gray-400">{icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
