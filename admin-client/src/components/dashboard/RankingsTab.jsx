"use client";
import React, { useState } from "react";
import { Award, Search, Filter, Trophy, Star } from "lucide-react";

export default function RankingsTab({ students }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // Get list of unique departments
  const departments = ["All", ...new Set(students.map(s => s.dept || "Computer Sci."))];

  // Calculate sorted rankings
  const rankedStudents = [...students]
    .sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0))
    .map((student, idx) => ({ ...student, rank: idx + 1 }));

  // Apply filters
  const filteredStudents = rankedStudents.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matric.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || (s.dept || "Computer Sci.") === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Helper to determine badge color for Class of Degree
  const getClassOfDegreeBadge = (cgpa) => {
    if (cgpa >= 4.50) {
      return { label: "1st Class", classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
    } else if (cgpa >= 3.50) {
      return { label: "2nd Class Upper", classes: "bg-slate-300/10 border-slate-300/20 text-slate-300" };
    } else if (cgpa >= 2.40) {
      return { label: "2nd Class Lower", classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
    } else if (cgpa >= 1.50) {
      return { label: "3rd Class", classes: "bg-orange-500/10 border-orange-500/20 text-orange-400" };
    } else {
      return { label: "Pass/Fail", classes: "bg-red-500/10 border-red-500/20 text-red-400" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white capitalize tracking-wide">Academic Rankings</h2>
          <p className="text-sm text-slate-400">View overall student standings based on calculated CGPA</p>
        </div>

        {/* Top Performer Card */}
        {rankedStudents.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Best Graduating Student</span>
              <p className="text-xs font-bold text-white mt-0.5">{rankedStudents[0].name}</p>
              <span className="text-[11px] text-slate-400 font-semibold">{rankedStudents[0].cgpa.toFixed(2)} CGPA</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or matric..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Department filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept} className="bg-[#0B0F19]">
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-16 text-center">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Matric Number</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center w-24">CGPA</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Class of Degree</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const degree = getClassOfDegreeBadge(s.cgpa);
                  const isTop3 = s.rank <= 3;
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-center font-bold">
                        {isTop3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs ${
                            s.rank === 1 ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                            s.rank === 2 ? "bg-slate-300/20 border-slate-300/30 text-slate-300" :
                            "bg-orange-500/20 border-orange-500/30 text-orange-400"
                          }`}>
                            {s.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">{s.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          {s.rank === 1 && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          <span className="text-xs font-semibold text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{s.matric}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{s.dept}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-white">
                        {s.cgpa.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${degree.classes}`}>
                          {degree.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 text-xs">
                    No student records found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
