"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import StatCards from "@/components/dashboard/StatCards";
import CGPAGrid from "@/components/spreadsheet/CGPAGrid";
import Login from "@/components/auth/Login";

import SemestersTab from "@/components/dashboard/SemestersTab";
import RankingsTab from "@/components/dashboard/RankingsTab";
import ReportsTab from "@/components/dashboard/ReportsTab";
import ImportExportTab from "@/components/dashboard/ImportExportTab";
import SettingsTab from "@/components/dashboard/SettingsTab";

// Helper to pre-calculate GPA & CGPA for student list on load
function calculateStudentGPAs(student, columnsList) {
  let totalUnits = 0;
  let totalPoints = 0;
  
  columnsList.forEach(c => {
    const val = student[c.key];
    if (val !== null && val !== undefined && val !== "") {
      const score = parseFloat(val);
      if (!isNaN(score)) {
        totalUnits += c.units;
        let gp = 0;
        if (score >= 70) gp = 5;
        else if (score >= 60) gp = 4;
        else if (score >= 50) gp = 3;
        else if (score >= 45) gp = 2;
        else if (score >= 40) gp = 1;
        else gp = 0;
        
        totalPoints += c.units * gp;
      }
    }
  });
  
  const gpa = totalUnits > 0 ? parseFloat((totalPoints / totalUnits).toFixed(2)) : 0.00;
  const cgpa = gpa; // single semester view
  
  let grade = "F";
  let remarks = "Fail";
  if (cgpa >= 4.50) { grade = "A"; remarks = "Excellent"; }
  else if (cgpa >= 3.50) { grade = "B"; remarks = "Very Good"; }
  else if (cgpa >= 2.40) { grade = "C"; remarks = "Good"; }
  else if (cgpa >= 1.50) { grade = "D"; remarks = "Pass"; }
  else if (cgpa >= 1.00) { grade = "E"; remarks = "Pass"; }

  return {
    ...student,
    totalUnits,
    gpa,
    cgpa,
    grade,
    remarks
  };
}

// API_BASE is computed at runtime inside the component to guarantee client-side window access
const getAPIBase = () => {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://cgpa-counter-production.up.railway.app/api";
};

export default function Dashboard() {
  const API_BASE = getAPIBase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [courseColumns, setCourseColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("all-saved"); // "all-saved", "saving", "error"
  const [lastSaved, setLastSaved] = useState(null);

  // Check auth state on mount and determine initial active tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      const user = localStorage.getItem("admin_user");
      if (token && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      // Determine initial active tab based on pathname
      const path = window.location.pathname;
      if (path === "/spreadsheet") setActiveTab("cgpa spreadsheet");
      else if (path === "/students") setActiveTab("students");
      else if (path === "/results") setActiveTab("results entry");
      else if (path === "/courses") setActiveTab("courses");
      else if (path === "/semesters") setActiveTab("semesters");
      else if (path === "/analytics") setActiveTab("analytics");
      else if (path === "/rankings") setActiveTab("rankings");
      else if (path === "/reports") setActiveTab("reports");
      else if (path === "/import-export") setActiveTab("import/export");
      else if (path === "/settings") setActiveTab("settings");
      else setActiveTab("dashboard");

      setCheckingAuth(false);
    }
  }, []);

  // Sync activeTab state changes to browser history/URL bar
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      const pathMap = {
        "dashboard": "/",
        "cgpa spreadsheet": "/spreadsheet",
        "students": "/students",
        "results entry": "/results",
        "courses": "/courses",
        "semesters": "/semesters",
        "analytics": "/analytics",
        "rankings": "/rankings",
        "reports": "/reports",
        "import/export": "/import-export",
        "settings": "/settings"
      };
      const newPath = pathMap[activeTab] || "/";
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, "", newPath);
      }
    }
  }, [activeTab, isAuthenticated]);

  // Fetch live student records and courses when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${API_BASE}/admin/students`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch student data");
        const rawData = await res.json();

        // Pivot flat course records into student rows
        const studentMap = {};
        const coursesFound = {};

        rawData.forEach((row) => {
          const id = row.studentId || row.matricNumber || row.fullName;
          if (!id) return;

          if (!studentMap[id]) {
            studentMap[id] = {
              id: id,
              studentId: row.studentId,
              name: row.fullName || "",
              matric: row.matricNumber || "",
              dept: row.department || "Computer Sci.",
              level: parseInt(row.level) || 200,
              _courseDetails: {},
            };
          }

          if (row.courseCode) {
            const courseCodeKey = row.courseCode.toLowerCase().replace(/[^a-z0-9]/g, "");
            studentMap[id][courseCodeKey] = row.score !== undefined ? row.score : null;
            studentMap[id]._courseDetails[courseCodeKey] = {
              courseId: row.courseId,
              courseCode: row.courseCode,
              courseTitle: row.courseTitle,
              unit: row.unit,
            };

            coursesFound[row.courseCode] = {
              key: courseCodeKey,
              label: row.courseCode,
              units: row.unit || 3,
            };
          }
        });

        const studentList = Object.values(studentMap);
        const columnsList = Object.values(coursesFound);

        // Fallback default columns if none in DB
        const defaultCols = [
          { key: "csc101", label: "CSC101", units: 3 },
          { key: "mth101", label: "MTH101", units: 3 },
          { key: "gst101", label: "GST101", units: 2 },
        ];

        const finalCols = columnsList.length > 0 ? columnsList : defaultCols;
        const computedStudentList = studentList.map(s => calculateStudentGPAs(s, finalCols));

        setCourseColumns(finalCols);
        setStudents(computedStudentList);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Error loading live dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated]);

  // Save pivoted student records back to database
  const saveStudentsToDatabase = async (currentStudents = students, currentColumns = courseColumns) => {
    try {
      setIsSaving(true);
      setSaveStatus("saving");

      const updates = [];
      currentStudents.forEach((s) => {
        if (currentColumns.length === 0) {
          updates.push({
            studentId: s.studentId,
            fullName: s.name,
            matricNumber: s.matric,
            department: s.dept,
            level: s.level.toString(),
          });
          return;
        }

        currentColumns.forEach((c) => {
          const scoreVal = s[c.key];
          const details = s._courseDetails?.[c.key] || {};

          let grade = "F";
          let gradePoint = 0;
          if (scoreVal !== null && scoreVal !== undefined && scoreVal !== "") {
            const score = parseFloat(scoreVal);
            if (!isNaN(score)) {
              if (score >= 70) { grade = "A"; gradePoint = 5; }
              else if (score >= 60) { grade = "B"; gradePoint = 4; }
              else if (score >= 50) { grade = "C"; gradePoint = 3; }
              else if (score >= 45) { grade = "D"; gradePoint = 2; }
              else if (score >= 40) { grade = "E"; gradePoint = 1; }
              else { grade = "F"; gradePoint = 0; }
            }
          }

          updates.push({
            studentId: s.studentId,
            fullName: s.name,
            matricNumber: s.matric,
            department: s.dept,
            level: s.level.toString(),
            courseId: details.courseId,
            courseCode: c.label,
            courseTitle: details.courseTitle || `${c.label} Course`,
            unit: c.units,
            score: scoreVal !== null && scoreVal !== undefined && scoreVal !== "" ? parseFloat(scoreVal) : 0,
            grade,
            gradePoint,
            session: "2023/2024",
            semester: "1st Semester",
          });
        });
      });

      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_BASE}/admin/results/bulk`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Saving bulk records failed");
      
      const data = await res.json();
      setSaveStatus("all-saved");
      setLastSaved(new Date().toLocaleTimeString());
      
      // Refresh local studentId mappings if new student users were generated
      // (This prevents creating duplicates next time we save)
      if (currentStudents.some(s => !s.studentId)) {
        const refreshRes = await fetch(`${API_BASE}/admin/students`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setStudents(prev => prev.map(s => {
            const match = freshData.find(f => f.matricNumber === s.matric);
            return match ? { ...s, studentId: match.studentId } : s;
          }));
        }
      }
    } catch (err) {
      console.error("Error saving live data:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    if (loading && ["dashboard", "cgpa spreadsheet", "students", "results entry", "courses", "rankings", "reports", "import/export"].includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center p-20 glass rounded-xl border border-white/5 my-6">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="mt-4 text-sm text-slate-400 font-medium animate-pulse">
            Loading live results database...
          </span>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <StatCards students={students} courseColumns={courseColumns} />
            <div className="glass rounded-xl border border-white/5 p-5">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                CGPA Excel Spreadsheet
              </h3>
              <CGPAGrid
                students={students}
                setStudents={setStudents}
                courseColumns={courseColumns}
                setCourseColumns={setCourseColumns}
                onSave={saveStudentsToDatabase}
                isSaving={isSaving}
                saveStatus={saveStatus}
                lastSaved={lastSaved}
              />
            </div>
          </div>
        );

      case "cgpa spreadsheet":
      case "students":
      case "results entry":
      case "courses":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-black text-white capitalize tracking-wide">{activeTab}</h2>
                <p className="text-sm text-slate-400">Manage, edit, and sync records in real-time</p>
              </div>
            </div>
            <CGPAGrid
              students={students}
              setStudents={setStudents}
              courseColumns={courseColumns}
              setCourseColumns={setCourseColumns}
              onSave={saveStudentsToDatabase}
              isSaving={isSaving}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
            />
          </div>
        );

      case "semesters":
        return <SemestersTab />;

      case "rankings":
        return <RankingsTab students={students} />;

      case "reports":
        return <ReportsTab students={students} />;

      case "import/export":
        return <ImportExportTab students={students} />;

      case "settings":
        return <SettingsTab />;

      default:
        // Render a gorgeous glassmorphic "Coming Soon / Under Development" view
        return (
          <div className="flex flex-col items-center justify-center p-16 glass rounded-2xl border border-white/5 max-w-2xl mx-auto my-12 text-center relative overflow-hidden group">
            {/* Ambient background glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-white/10 relative">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur animate-pulse" />
              <span className="text-2xl">⚡</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 capitalize">
              {activeTab.replace("-", " ")} Module
            </h3>
            
            <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
              This module is currently being calibrated and connected to the Federal Polytechnic portal databases. 
              Real-time synchronization services are undergoing security testing.
            </p>

            <div className="w-full max-w-sm bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span>Database Sync Tunnel</span>
                <span className="text-emerald-400 font-semibold animate-pulse">75% Connected</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-[75%]" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
              Secure Socket Shell (SSH) active
            </div>
          </div>
        );
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} apiBase={API_BASE} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 ml-56 flex flex-col relative overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-5 relative z-10">
          <div className="max-w-full mx-auto pb-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
