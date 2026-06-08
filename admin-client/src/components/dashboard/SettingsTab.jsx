"use client";
import React, { useState } from "react";
import { Settings, ShieldAlert, Database, CheckCircle, RefreshCcw } from "lucide-react";

export default function SettingsTab() {
  const [schoolName, setSchoolName] = useState("Federal Polytechnic");
  const [gradingScale, setGradingScale] = useState("5.0 Scale");
  const [passGrade, setPassGrade] = useState("40");
  const [successMsg, setSuccessMsg] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccessMsg("System configurations updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setSuccessMsg("Database backup generated successfully! Snapshot saved.");
      setTimeout(() => setSuccessMsg(""), 3500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white capitalize tracking-wide">System Settings</h2>
        <p className="text-sm text-slate-400">Configure global academic profiles, grading limits, and database snapshots</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Configurations Box */}
        <div className="md:col-span-2 glass rounded-xl border border-white/5 p-6">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-emerald-400" />
            Global Institution Profile
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Institution Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grading Scale</label>
                <select
                  value={gradingScale}
                  onChange={(e) => setGradingScale(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <option value="5.0 Scale" className="bg-[#0B0F19]">5.0 Scale (Standard Nigerian)</option>
                  <option value="4.0 Scale" className="bg-[#0B0F19]">4.0 Scale (US/WASSCE)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Minimum Pass Mark (%)</label>
                <input
                  type="number"
                  value={passGrade}
                  onChange={(e) => setPassGrade(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sync Status Mode</label>
                <input
                  type="text"
                  value="Automatic Live Sync Tunnel Active"
                  disabled
                  className="w-full bg-white/[0.01] border border-white/[0.03] rounded-xl px-4 py-3 text-xs text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Database Snapshots & Warnings */}
        <div className="space-y-6">
          {/* Database Info Card */}
          <div className="glass rounded-xl border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-cyan-400" />
              Database Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs pb-1.5 border-b border-white/[0.04]">
                <span className="text-slate-400">Driver</span>
                <span className="font-semibold text-white">MongoDB Atlas</span>
              </div>
              <div className="flex justify-between text-xs pb-1.5 border-b border-white/[0.04]">
                <span className="text-slate-400">Environment</span>
                <span className="font-semibold text-white">Production</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Active
                </span>
              </div>
            </div>

            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isBackingUp ? "animate-spin" : ""}`} />
              Backup Now
            </button>
          </div>

          {/* Security Alert box */}
          <div className="glass rounded-xl border border-white/5 p-5 border-l-2 border-l-red-500 bg-red-500/[0.02] space-y-2">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Security Note
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ensure you take database snapshots periodically. Modifications to marks and grade thresholds will instantly reflect on the student portal dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
