"use client";
import React, { useState, useEffect } from "react";
import StatCards from "@/components/dashboard/StatCards";
import CGPAGrid from "@/components/spreadsheet/CGPAGrid";
import { Loader2, CloudLightning, CheckCircle } from "lucide-react";

// Recompute helper for initial load
function recomputeStudent(student, coursesList) {
  let totalUnits = 0;
  let totalPoints = 0;
  
  coursesList.forEach(c => {
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
  const cgpa = gpa;
  
  let grade = "F";
  let remarks = "Fail";
  
  if (cgpa >= 4.50) {
    grade = "A";
    remarks = "Excellent";
  } else if (cgpa >= 3.50) {
    grade = "B";
    remarks = "Very Good";
  } else if (cgpa >= 2.40) {
    grade = "C";
    remarks = "Good";
  } else if (cgpa >= 1.50) {
    grade = "D";
    remarks = "Pass";
  } else if (cgpa >= 1.00) {
    grade = "E";
    remarks = "Pass";
  }
  
  return {
    ...student,
    totalUnits,
    gpa,
    cgpa,
    grade,
    remarks
  };
}

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [courseColumns, setCourseColumns] = useState([
    { key: "csc101", label: "CSC101", units: 3 },
    { key: "mth101", label: "MTH101", units: 3 },
    { key: "gst101", label: "GST101", units: 2 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "success", "error"

  const getApiBase = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:5000/api";
      }
      return "https://cgpa-counter-production.up.railway.app/api";
    }
    return "https://cgpa-counter-production.up.railway.app/api";
  };

  const getHeaders = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
    }
    return { "Content-Type": "application/json" };
  };

  // 1. Process URL token/user parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const user = urlParams.get("user");
      if (token && user) {
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_user", user);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Redirect to login if not authenticated
      const savedToken = localStorage.getItem("admin_token");
      if (!savedToken) {
        window.location.href = "/admin-login.html";
        return;
      }
      
      fetchData();
    }
  }, []);

  // 2. Fetch students data from the API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/students`, {
        headers: getHeaders(),
      });
      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin-login.html";
        return;
      }
      if (!res.ok) throw new Error("Failed to load students");
      
      const rawData = await res.json();
      
      // Pivot data
      const studentMap = {};
      const coursesMap = {};

      rawData.forEach(row => {
        const studentId = row.studentId || row.fullName;
        
        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            id: studentId,
            name: row.fullName,
            matric: row.matricNumber === 'N/A' ? '' : row.matricNumber,
            dept: row.department === 'N/A' ? '' : row.department,
            level: parseInt(row.level) || 200,
            courseIds: {},
            courseTitles: {},
            semesters: {},
            sessions: {},
          };
        }

        if (row.courseCode) {
          const courseKey = row.courseCode.toLowerCase().replace(/[^a-z0-9]/g, "");
          
          coursesMap[courseKey] = {
            key: courseKey,
            label: row.courseCode.toUpperCase(),
            units: row.unit || 3
          };

          studentMap[studentId][courseKey] = row.score;
          studentMap[studentId].courseIds[courseKey] = row.courseId;
          studentMap[studentId].courseTitles[courseKey] = row.courseTitle;
          studentMap[studentId].semesters[courseKey] = row.semester || '1st Semester';
          studentMap[studentId].sessions[courseKey] = row.session || '2024/2025';
        }
      });

      const studentsList = Object.values(studentMap);
      const courseCols = Object.values(coursesMap);

      if (courseCols.length > 0) {
        setCourseColumns(courseCols);
      }
      
      const computedStudents = studentsList.map(s => recomputeStudent(s, courseCols.length > 0 ? courseCols : courseColumns));
      setStudents(computedStudents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Save students data to the API
  const handleSaveToDatabase = async (currentStudents, currentCols) => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const updates = [];

      currentStudents.forEach(student => {
        const isMockId = typeof student.id === 'number';
        const studentId = isMockId ? undefined : student.id;

        currentCols.forEach(c => {
          const score = student[c.key];
          if (score !== null && score !== undefined && score !== "") {
            const numericScore = parseFloat(score);
            if (!isNaN(numericScore)) {
              let gp = 0;
              let grade = 'F';
              if (numericScore >= 70) { gp = 5; grade = 'A'; }
              else if (numericScore >= 60) { gp = 4; grade = 'B'; }
              else if (numericScore >= 50) { gp = 3; grade = 'C'; }
              else if (numericScore >= 45) { gp = 2; grade = 'D'; }
              else if (numericScore >= 40) { gp = 1; grade = 'E'; }
              
              updates.push({
                studentId: studentId,
                fullName: student.name,
                matricNumber: student.matric,
                department: student.dept || 'Computer Sci.',
                level: student.level?.toString() || '200',
                courseId: student.courseIds?.[c.key],
                courseCode: c.label,
                courseTitle: student.courseTitles?.[c.key] || `${c.label} Course`,
                unit: c.units,
                score: numericScore,
                grade: grade,
                gradePoint: gp,
                session: student.sessions?.[c.key] || '2024/2025',
                semester: student.semesters?.[c.key] || '1st Semester'
              });
            }
          }
        });

        // Even if student has no courses, save their user record
        const studentCourses = currentCols.filter(c => student[c.key] !== null && student[c.key] !== undefined && student[c.key] !== "");
        if (studentCourses.length === 0) {
          updates.push({
            studentId: studentId,
            fullName: student.name,
            matricNumber: student.matric,
            department: student.dept || 'Computer Sci.',
            level: student.level?.toString() || '200'
          });
        }
      });

      const res = await fetch(`${getApiBase()}/admin/results/bulk`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Failed to save records");
      
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(""), 3000);
      
      // Reload updated data
      await fetchData();
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-full mx-auto pb-8 relative">
      {/* Save status notification overlay */}
      {saveStatus && (
        <div className="fixed top-20 right-8 z-50 animate-fade-in flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-xl text-xs font-semibold backdrop-blur-md bg-slate-900/90 border-slate-700/50">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-emerald-400">Saving to cloud database...</span>
            </>
          )}
          {saveStatus === "success" && (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">Database updated successfully!</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <CloudLightning className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Failed to save. Check server connection.</span>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium">Fetching student records from database...</span>
        </div>
      ) : (
        <>
          <StatCards students={students} courseColumns={courseColumns} />
          <CGPAGrid 
            students={students} 
            setStudents={setStudents} 
            courseColumns={courseColumns} 
            setCourseColumns={setCourseColumns}
            onSave={handleSaveToDatabase}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}
