"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import StatCards from "@/components/dashboard/StatCards";
import CGPAGrid from "@/components/spreadsheet/CGPAGrid";
import Login from "@/components/auth/Login";

const API_BASE = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  ? "http://localhost:5000/api"
  : "https://cgpa-counter-production.up.railway.app/api";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [students, setStudents] = useState([]);
  const [courseColumns, setCourseColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("all-saved"); // "all-saved", "saving", "error"
  const [lastSaved, setLastSaved] = useState(null);

  // Check auth state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      const user = localStorage.getItem("admin_user");
      if (token && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setCheckingAuth(false);
    }
  }, []);

  // Fetch live student records and courses when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/admin/students`);
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

        setCourseColumns(columnsList.length > 0 ? columnsList : defaultCols);
        setStudents(studentList);
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

      const res = await fetch(`${API_BASE}/admin/results/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col relative overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-5 relative z-10">
          <div className="max-w-full mx-auto pb-8">
            <StatCards students={students} courseColumns={courseColumns} />
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 glass rounded-xl border border-white/5">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Loading live results database...</span>
              </div>
            ) : (
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
