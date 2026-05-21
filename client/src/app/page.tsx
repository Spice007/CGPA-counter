'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowRight, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Automatically redirect to the calculator for a seamless experience
        router.push('/dashboard/calculator');
    }, [router]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-height-screen bg-[#0f172a] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />

            {/* Navbar */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <GraduationCap className="text-white" size={24} />
                    </div>
                    <span className="text-2xl font-bold font-outfit">NaijaCGPA<span className="text-primary">.</span></span>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
                    <Link href="/register" className="btn-primary">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-20 pb-32 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl mx-auto text-center"
                >
                    <motion.h1 
                        variants={itemVariants}
                        className="text-6xl md:text-7xl font-extrabold font-outfit leading-tight mb-8"
                    >
                        Master Your Grades with <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            NaijaCGPA Pro
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        variants={itemVariants}
                        className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        The ultimate CGPA calculator tailored for Nigerian tertiary institutions. 
                        Track semesters, predict outcomes, and generate professional transcripts in seconds.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/register" className="btn-primary px-8 py-4 text-lg flex items-center gap-2 group">
                            Start Calculating <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="glass-card !p-4 !px-8 text-lg font-semibold hover:bg-white/5">
                            Learn More
                        </button>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-3 gap-8 mt-32"
                >
                    <FeatureCard 
                        icon={<Zap className="text-primary" />}
                        title="Real-time Results"
                        description="Instantly see your GPA as you enter your grades. No more manual calculations."
                    />
                    <FeatureCard 
                        icon={<BarChart3 className="text-secondary" />}
                        title="Visual Analytics"
                        description="Track your academic performance over sessions with beautiful, interactive charts."
                    />
                    <FeatureCard 
                        icon={<ShieldCheck className="text-accent" />}
                        title="Secure & Private"
                        description="Your data is encrypted and stored securely. Your academic journey is your business."
                    />
                </motion.div>
            </main>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="glass-card hover:translate-y-[-8px] transition-all duration-500"
        >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </motion.div>
    );
}
