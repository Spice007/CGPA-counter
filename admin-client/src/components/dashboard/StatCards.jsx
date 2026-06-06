"use client";
import React from "react";
import { Users, TrendingUp, Award, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function StatCards({ students = [], courseColumns = [] }) {
  const totalStudents = students.length;

  // Calculate average CGPA dynamically
  const cgpas = students.map((s) => s.cgpa).filter((c) => c !== null && c !== undefined && !isNaN(c));
  const averageCGPA = cgpas.length > 0 ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : "0.00";

  // Calculate best CGPA dynamically
  let bestCGPA = "0.00";
  let bestStudentName = "N/A";
  if (students.length > 0) {
    const validCGPAStudents = students.filter((s) => s.cgpa !== null && s.cgpa !== undefined && !isNaN(s.cgpa));
    if (validCGPAStudents.length > 0) {
      const sorted = [...validCGPAStudents].sort((a, b) => b.cgpa - a.cgpa);
      if (sorted[0]) {
        bestCGPA = typeof sorted[0].cgpa === 'number' ? sorted[0].cgpa.toFixed(2) : parseFloat(sorted[0].cgpa || 0).toFixed(2);
        bestStudentName = sorted[0].name || "Unnamed Student";
      }
    }
  }

  // Calculate pass & fail numbers dynamically (default to 0.0 for students with no CGPA calculated yet)
  const passedCount = students.filter((s) => s.cgpa !== null && s.cgpa !== undefined && s.cgpa >= 1.00).length;
  const passPercent = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(1) : "0.0";

  const failedCount = students.filter((s) => s.cgpa !== null && s.cgpa !== undefined && s.cgpa < 1.00).length;
  const failPercent = totalStudents > 0 ? ((failedCount / totalStudents) * 100).toFixed(1) : "0.0";

  const stats = [
    {
      title: "Total Students",
      value: totalStudents.toString(),
      subtitle: totalStudents > 0 ? "Active records" : "No active records",
      icon: Users,
      gradient: "from-blue-600/30 to-blue-800/10",
      borderColor: "border-l-blue-500",
      iconColor: "text-blue-400",
      glowColor: "rgba(59,130,246,0.35)",
      graphic: (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="absolute bottom-1 right-1 opacity-40">
          <polyline points="2,16 8,12 14,14 20,8 26,10 30,4" stroke="rgba(59,130,246,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Average CGPA",
      value: averageCGPA,
      subtitle: "Nigerian 5.0 scale",
      icon: TrendingUp,
      gradient: "from-emerald-600/30 to-emerald-800/10",
      borderColor: "border-l-emerald-500",
      iconColor: "text-emerald-400",
      glowColor: "rgba(16,185,129,0.35)",
      graphic: (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="absolute bottom-1 right-1 opacity-40">
          <rect x="2" y="12" width="4" height="6" rx="1" fill="rgba(16,185,129,0.5)" />
          <rect x="9" y="8" width="4" height="10" rx="1" fill="rgba(16,185,129,0.6)" />
          <rect x="16" y="10" width="4" height="8" rx="1" fill="rgba(16,185,129,0.5)" />
          <rect x="23" y="4" width="4" height="14" rx="1" fill="rgba(16,185,129,0.7)" />
        </svg>
      ),
    },
    {
      title: "Best CGPA",
      value: bestCGPA,
      subtitle: bestStudentName,
      icon: Award,
      gradient: "from-amber-600/30 to-amber-800/10",
      borderColor: "border-l-amber-500",
      iconColor: "text-amber-400",
      glowColor: "rgba(245,158,11,0.35)",
      graphic: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="absolute bottom-0 right-0 opacity-30">
          <polygon points="14,2 17,10 26,10 19,15 21,24 14,19 7,24 9,15 2,10 11,10" fill="rgba(245,158,11,0.4)" stroke="rgba(245,158,11,0.5)" strokeWidth="0.5" />
        </svg>
      ),
    },
    {
      title: "Students Passed",
      value: passedCount.toString(),
      subtitle: `${passPercent}% pass rate`,
      icon: CheckCircle2,
      gradient: "from-emerald-600/30 to-green-800/10",
      borderColor: "border-l-emerald-500",
      iconColor: "text-emerald-400",
      glowColor: "rgba(16,185,129,0.35)",
      graphic: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="absolute bottom-0 right-0 opacity-30">
          <circle cx="14" cy="14" r="11" stroke="rgba(16,185,129,0.4)" strokeWidth="2" fill="none" strokeDasharray="55 14" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Students Failed",
      value: failedCount.toString(),
      subtitle: `${failPercent}% fail rate`,
      icon: XCircle,
      gradient: "from-red-600/30 to-red-800/10",
      borderColor: "border-l-red-500",
      iconColor: "text-red-400",
      glowColor: "rgba(239,68,68,0.35)",
      graphic: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute bottom-1 right-1 opacity-30">
          <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="4" x2="4" y2="20" stroke="rgba(239,68,68,0.5)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Courses Offered",
      value: courseColumns.length.toString(),
      subtitle: courseColumns.length > 0 ? courseColumns.map((c) => c.label).join(", ") : "No courses",
      icon: BookOpen,
      gradient: "from-cyan-600/30 to-blue-800/10",
      borderColor: "border-l-cyan-500",
      iconColor: "text-cyan-400",
      glowColor: "rgba(6,182,212,0.35)",
      graphic: (
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none" className="absolute bottom-1 right-1 opacity-30">
          <rect x="2" y="4" width="10" height="14" rx="1" stroke="rgba(6,182,212,0.5)" strokeWidth="1" fill="rgba(6,182,212,0.1)" />
          <rect x="16" y="4" width="10" height="14" rx="1" stroke="rgba(6,182,212,0.5)" strokeWidth="1" fill="rgba(6,182,212,0.1)" />
          <line x1="14" y1="2" x2="14" y2="20" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-6 gap-3 mb-6"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            className={`relative overflow-hidden rounded-xl p-4 bg-[#0d1526] border border-white/[0.06] border-l-[3px] ${stat.borderColor}`}
          >
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} pointer-events-none`}
            />

            {/* Background graphic */}
            {stat.graphic}

            {/* Content */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{stat.subtitle}</p>
              </div>

              {/* Icon with glow */}
              <div className="relative flex-shrink-0 ml-2">
                <div
                  className="absolute inset-0 rounded-full blur-lg"
                  style={{ backgroundColor: stat.glowColor }}
                />
                <Icon
                  className={`relative w-5 h-5 ${stat.iconColor}`}
                  strokeWidth={1.8}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
