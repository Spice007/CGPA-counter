"use client";
import React from "react";
import { BarChart3, Users, Award, Percent, Printer, FileDown } from "lucide-react";

export default function ReportsTab({ students }) {
  const totalStudents = students.length;

  // Grade classifications
  let firstClass = 0;
  let secondUpper = 0;
  let secondLower = 0;
  let thirdClass = 0;
  let passFail = 0;
  let totalCGPA = 0;

  students.forEach(s => {
    totalCGPA += s.cgpa || 0;
    if (s.cgpa >= 4.50) firstClass++;
    else if (s.cgpa >= 3.50) secondUpper++;
    else if (s.cgpa >= 2.40) secondLower++;
    else if (s.cgpa >= 1.50) thirdClass++;
    else passFail++;
  });

  const avgCGPA = totalStudents > 0 ? (totalCGPA / totalStudents).toFixed(2) : "0.00";
  const passRate = totalStudents > 0 ? (((totalStudents - passFail) / totalStudents) * 100).toFixed(1) : "0.0";

  const getPercent = (count) => {
    if (totalStudents === 0) return 0;
    return ((count / totalStudents) * 100).toFixed(1);
  };

  const handlePrintReport = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white capitalize tracking-wide">Academic Reports</h2>
          <p className="text-sm text-slate-400">View statistical and graphical breakdowns of academic performances</p>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrintReport}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Printer className="w-4 h-4" />
          Print Performance Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass rounded-xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Evaluated</span>
            <p className="text-xl font-black text-white mt-1">{totalStudents}</p>
          </div>
        </div>

        <div className="glass rounded-xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average CGPA</span>
            <p className="text-xl font-black text-white mt-1">{avgCGPA}</p>
          </div>
        </div>

        <div className="glass rounded-xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pass Rate</span>
            <p className="text-xl font-black text-white mt-1">{passRate}%</p>
          </div>
        </div>

        <div className="glass rounded-xl border border-white/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">First Class Graduates</span>
            <p className="text-xl font-black text-white mt-1">{firstClass}</p>
          </div>
        </div>
      </div>

      {/* Class Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Graphical Progress Casing */}
        <div className="md:col-span-2 glass rounded-xl border border-white/5 p-6">
          <h3 className="text-sm font-bold text-white mb-6">Class of Degree Distribution</h3>
          
          <div className="space-y-4">
            {/* First Class */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="text-white">First Class Honors (4.50 - 5.00)</span>
                <span>{firstClass} ({getPercent(firstClass)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/50 border border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${getPercent(firstClass)}%` }}
                />
              </div>
            </div>

            {/* Second Upper */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="text-white">Second Class Upper Division (3.50 - 4.49)</span>
                <span>{secondUpper} ({getPercent(secondUpper)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/50 border border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${getPercent(secondUpper)}%` }}
                />
              </div>
            </div>

            {/* Second Lower */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="text-white">Second Class Lower Division (2.40 - 3.49)</span>
                <span>{secondLower} ({getPercent(secondLower)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/50 border border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${getPercent(secondLower)}%` }}
                />
              </div>
            </div>

            {/* Third Class */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="text-white">Third Class Honors (1.50 - 2.39)</span>
                <span>{thirdClass} ({getPercent(thirdClass)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/50 border border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${getPercent(thirdClass)}%` }}
                />
              </div>
            </div>

            {/* Pass/Fail */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="text-white">Pass / Fail (&lt; 1.50)</span>
                <span>{passFail} ({getPercent(passFail)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/50 border border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${getPercent(passFail)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="glass rounded-xl border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Grade Policy Summary</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Nigerian Universities Commission (NUC) and NBTE standards dictate a 5-Point GPA scoring matrix.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs border-b border-white/[0.04] pb-1.5">
                <span className="text-slate-400">First Class</span>
                <span className="font-semibold text-white">4.50 - 5.00</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/[0.04] pb-1.5">
                <span className="text-slate-400">2.1 Division</span>
                <span className="font-semibold text-white">3.50 - 4.49</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/[0.04] pb-1.5">
                <span className="text-slate-400">2.2 Division</span>
                <span className="font-semibold text-white">2.40 - 3.49</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/[0.04] pb-1.5">
                <span className="text-slate-400">Third Class</span>
                <span className="font-semibold text-white">1.50 - 2.39</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Pass</span>
                <span className="font-semibold text-white">1.00 - 1.49</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.04] text-[10px] text-slate-500">
            Reports generated automatically from MongoDB live data.
          </div>
        </div>
      </div>
    </div>
  );
}
