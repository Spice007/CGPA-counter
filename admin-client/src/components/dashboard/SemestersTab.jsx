"use client";
import React, { useState } from "react";
import { Calendar, ToggleLeft, ToggleRight, Plus, CheckCircle, Clock } from "lucide-react";

export default function SemestersTab() {
  const [currentSession, setCurrentSession] = useState("2024/2025");
  const [currentSemester, setCurrentSemester] = useState("1st Semester");
  const [sessions, setSessions] = useState([
    { id: 1, session: "2024/2025", active: true },
    { id: 2, session: "2023/2024", active: false },
    { id: 3, session: "2022/2023", active: false }
  ]);
  const [semesters, setSemesters] = useState([
    { id: 1, name: "1st Semester", active: true },
    { id: 2, name: "2nd Semester", active: false }
  ]);

  const [newSession, setNewSession] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSetSession = (sessionVal) => {
    setCurrentSession(sessionVal);
    setSessions(prev => prev.map(s => ({ ...s, active: s.session === sessionVal })));
    triggerNotification(`Active session switched to ${sessionVal}`);
  };

  const handleSetSemester = (semName) => {
    setCurrentSemester(semName);
    setSemesters(prev => prev.map(s => ({ ...s, active: s.name === semName })));
    triggerNotification(`Active semester switched to ${semName}`);
  };

  const handleAddSession = (e) => {
    e.preventDefault();
    if (!newSession.trim()) return;
    if (sessions.some(s => s.session === newSession)) {
      alert("Session already exists!");
      return;
    }
    const added = { id: Date.now(), session: newSession, active: false };
    setSessions(prev => [added, ...prev]);
    setNewSession("");
    triggerNotification(`New session ${newSession} added!`);
  };

  const triggerNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white capitalize tracking-wide">Academic Semesters</h2>
        <p className="text-sm text-slate-400">Configure active academic sessions and active semesters</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Configuration */}
        <div className="md:col-span-2 space-y-6">
          {/* Current Status Board */}
          <div className="glass rounded-xl border border-white/5 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Status</span>
                <h3 className="text-lg font-bold text-white mt-1">Current Academic Term</h3>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Database Connected
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                <span className="text-slate-500 text-xs block">Active Session</span>
                <span className="text-white text-xl font-black mt-1 block">{currentSession}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                <span className="text-slate-500 text-xs block">Active Semester</span>
                <span className="text-emerald-400 text-xl font-black mt-1 block">{currentSemester}</span>
              </div>
            </div>
          </div>

          {/* Manage Sessions & Semesters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Sessions Box */}
            <div className="glass rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                Select Session
              </h3>
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSetSession(s.session)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      s.active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="text-xs font-semibold">{s.session}</span>
                    {s.active ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Semesters Box */}
            <div className="glass rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-cyan-400" />
                Select Semester
              </h3>
              <div className="space-y-2.5">
                {semesters.map((sem) => (
                  <div
                    key={sem.id}
                    onClick={() => handleSetSemester(sem.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      sem.active
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="text-xs font-semibold">{sem.name}</span>
                    {sem.active ? (
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Creation Panel */}
        <div className="space-y-6">
          <div className="glass rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Add Academic Session</h3>
            <form onSubmit={handleAddSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Session Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2025/2026"
                  value={newSession}
                  onChange={(e) => setNewSession(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>
            </form>
          </div>

          <div className="glass rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-bold text-white mb-2">Academic Calendar</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Active sessions and semesters govern the context for GPAs. Switching sessions changes the spreadsheet rows to display only relevant marks for that term.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
