"use client";
import {
  LayoutDashboard, TableProperties, Users, FileSignature,
  BookOpen, Calendar, LineChart, Trophy, FileText,
  Settings, LogOut, ChevronRight, ArrowDownUp, Shield,
  HardDrive, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "CGPA Spreadsheet", icon: TableProperties, href: "/spreadsheet" },
  { label: "Students", icon: Users, href: "/students" },
  { label: "Results Entry", icon: FileSignature, href: "/results" },
  { label: "Courses", icon: BookOpen, href: "/courses" },
  { label: "Semesters", icon: Calendar, href: "/semesters", expandable: true },
  { label: "Analytics", icon: LineChart, href: "/analytics" },
  { label: "Rankings", icon: Trophy, href: "/rankings" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Import/Export", icon: ArrowDownUp, href: "/import-export", expandable: true },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const STORAGE_USED_GB = 2.48;
const STORAGE_TOTAL_GB = 10;
const STORAGE_PERCENT = ((STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100).toFixed(1);

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen fixed left-0 top-0 bg-[#0a0e1a] flex flex-col z-50 border-r border-white/[0.06]">
      {/* ── Logo / Brand ── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Shield crest icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white text-[13px] tracking-wide whitespace-nowrap">
                CGPA COUNTER
              </h1>
              <span className="text-[9px] font-semibold bg-emerald-500/90 text-white px-1.5 py-0.5 rounded leading-none">
                Excel
              </span>
            </div>
          </div>
        </div>

        {/* School info */}
        <div className="mt-2 pl-[42px]">
          <p className="text-[10px] text-slate-500 leading-relaxed">Federal Polytechnic</p>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-[10px] text-slate-500">School Admin</p>
            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full leading-none">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href}>
              <div
                className={clsx(
                  "group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                )}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-400 rounded-r-full"
                  />
                )}

                <Icon
                  className={clsx(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-emerald-400" : "group-hover:text-slate-300"
                  )}
                />
                <span className="text-[12px] font-medium flex-1 truncate">
                  {item.label}
                </span>

                {item.expandable && (
                  <ChevronRight
                    className={clsx(
                      "w-3 h-3 flex-shrink-0 transition-colors",
                      isActive ? "text-emerald-400/60" : "text-slate-700"
                    )}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ── */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] space-y-2.5">
        {/* Storage Widget */}
        <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] text-slate-500 font-medium">Storage Used</span>
            </div>
            <span className="text-[10px] text-blue-400 font-semibold">{STORAGE_PERCENT}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${STORAGE_PERCENT}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-600 mt-1">
            {STORAGE_USED_GB} GB / {STORAGE_TOTAL_GB} GB
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_user");
              window.location.href = "/admin-login.html";
            }
          }}

          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-[11px] font-medium cursor-pointer border border-red-500/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
