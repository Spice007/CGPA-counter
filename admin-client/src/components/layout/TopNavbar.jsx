"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Settings,
  ChevronDown,
  CalendarDays,
  CheckCircle2,
  Volume2,
  User,
  Shield,
  FileSignature,
  Sliders,
  LogOut,
  X
} from "lucide-react";

export default function TopNavbar() {
  const [session, setSession] = useState("2024/2025");
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle dynamic light/dark mode
  const toggleTheme = () => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        html.classList.add("light");
        html.style.colorScheme = "light";
        setIsDarkMode(false);
      } else {
        html.classList.remove("light");
        html.classList.add("dark");
        html.style.colorScheme = "dark";
        setIsDarkMode(true);
      }
    }
  };

  const notifications = [
    { id: 1, text: "Welcome to Naija CGPA Pro spreadsheet editor!", time: "Just now", read: false },
    { id: 2, text: "Dynamic Excel Formula calculations loaded on 5.0 scale.", time: "5 mins ago", read: false },
    { id: 3, text: "Excel CSV Import & Export services are fully operational.", time: "1 hour ago", read: true },
  ];

  return (
    <header className="h-[60px] sticky top-0 z-40 flex items-center justify-between px-6 bg-[#0B1120] border-b border-white/5 relative select-none">
      
      {/* ── Search Bar ── */}
      <div className="relative w-96 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-300 transition-colors" />
        <input
          type="text"
          placeholder="Search students, matric number, courses..."
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg py-2 pl-10 pr-20 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <kbd className="text-[10px] text-slate-500 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono leading-none">
            Ctrl
          </kbd>
          <kbd className="text-[10px] text-slate-500 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono leading-none">
            K
          </kbd>
        </div>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-4 relative">
        
        {/* Session Selector */}
        <div className="relative">
          <div 
            onClick={() => setShowSessionDropdown(!showSessionDropdown)}
            className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white/[0.07] transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[13px] text-slate-200 font-medium whitespace-nowrap">
              {session} Session
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {showSessionDropdown && (
            <div className="absolute top-11 right-0 w-44 bg-[#0d1323] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50 animate-fade-in">
              {["2023/2024", "2024/2025", "2025/2026"].map((s) => (
                <div
                  key={s}
                  onClick={() => {
                    setSession(s);
                    setShowSessionDropdown(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-white/[0.05] transition-colors ${
                    session === s ? "text-emerald-400 bg-emerald-500/[0.04]" : "text-slate-300"
                  }`}
                >
                  {s} Session
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          
          {/* Notification bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
                setShowSessionDropdown(false);
              }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-red-500 text-[8px] font-bold text-white px-0.5 leading-none">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute top-11 right-0 w-80 bg-[#0d1323] border border-white/[0.08] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Notifications</span>
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">3 New</span>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-white/[0.02] transition-colors flex flex-col gap-1">
                      <p className={`text-xs ${n.read ? "text-slate-400" : "text-white font-medium"}`}>{n.text}</p>
                      <span className="text-[9px] text-slate-500">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark/Light mode toggle */}
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px] text-amber-400 animate-spin-slow" />}
          </button>

          {/* Settings gear */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors cursor-pointer"
            title="Dashboard Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Admin Profile */}
        <div className="relative">
          <div 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
              setShowSessionDropdown(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-white/[0.03] rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AD
            </div>
            <div className="hidden lg:block min-w-0 text-left">
              <p className="text-[13px] font-semibold text-white leading-tight">Admin</p>
              <p className="text-[10px] text-slate-500 leading-tight">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />
          </div>

          {showProfileDropdown && (
            <div className="absolute top-12 right-0 w-48 bg-[#0d1323] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50 animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-white/[0.05] leading-none">
                <span className="text-[10px] text-slate-500">Logged in as</span>
                <p className="text-xs font-bold text-white mt-1">Super Admin</p>
              </div>
              <div 
                onClick={() => {
                  setShowSettingsModal(true);
                  setShowProfileDropdown(false);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] cursor-pointer transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" /> Profile Settings
              </div>
              <div 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                    window.location.href = "http://localhost:3001/admin-login.html";
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/[0.04] cursor-pointer transition-colors border-t border-white/[0.05] flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0d1323] p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">System Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 text-slate-300 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[11px] leading-relaxed text-emerald-300">All student record services and dynamic calculations are connected to the live local PostgreSQL and MongoDB databases.</p>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Application Mode</span>
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-lg">
                  <span className="font-semibold text-white">Academic Scale</span>
                  <span className="font-bold text-emerald-400">Nigerian 5.0 scale</span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-lg">
                  <span className="font-semibold text-white">Auto Save state</span>
                  <span className="font-bold text-emerald-400">Active (Auto Cloud)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4 mt-5">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
