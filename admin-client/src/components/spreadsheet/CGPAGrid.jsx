"use client";
import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  Printer,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  Filter,
  Search,
  X,
  Columns3,
  Settings,
  Calculator,
  ToggleLeft,
  ToggleRight,
  Table2,
  Users,
  TrendingUp,
  Award,
  ArrowUpDown,
  Lock,
  Edit,
  Trash2,
  Database,
  BookOpen,
} from "lucide-react";

// ─── Constant Mock Data (Fallback / Sample Data) ─────────────────────────────
const MOCK_STUDENTS = [
  { id: 1, name: "John David", matric: "22/CSC/004", dept: "Computer Sci.", level: 200, csc101: 78, mth101: 65, gst101: 70 },
  { id: 2, name: "Mary Johnson", matric: "22/CSC/008", dept: "Computer Sci.", level: 200, csc101: 55, mth101: 72, gst101: 68 },
  { id: 3, name: "Daniel Okoro", matric: "22/CSC/012", dept: "Computer Sci.", level: 200, csc101: 82, mth101: 90, gst101: 75 },
  { id: 4, name: "Blessing Nneka", matric: "22/CSC/015", dept: "Computer Sci.", level: 200, csc101: 45, mth101: 50, gst101: 48 },
  { id: 5, name: "Peter Emmanuel", matric: "22/CSC/019", dept: "Computer Sci.", level: 200, csc101: 39, mth101: 42, gst101: 40 },
  { id: 6, name: "Victoria James", matric: "22/CSC/021", dept: "Computer Sci.", level: 200, csc101: 67, mth101: 64, gst101: 70 },
  { id: 7, name: "Ahmed Yusuf", matric: "22/CSC/025", dept: "Computer Sci.", level: 200, csc101: 91, mth101: 88, gst101: 82 },
  { id: 8, name: "Esther Monday", matric: "22/CSC/028", dept: "Computer Sci.", level: 200, csc101: 60, mth101: 55, gst101: 58 },
  { id: 9, name: "Samuel Bright", matric: "22/CSC/030", dept: "Computer Sci.", level: 200, csc101: 74, mth101: 80, gst101: 70 },
  { id: 10, name: "Grace Williams", matric: "22/CSC/033", dept: "Computer Sci.", level: 200, csc101: 85, mth101: 78, gst101: 80 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getScoreClasses(score) {
  if (score === null || score === undefined || score === "") return "text-slate-600 italic";
  const num = parseFloat(score);
  if (num >= 70) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
  if (num >= 50) return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  if (num >= 40) return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/40 font-semibold";
}

function getRemarksClasses(remark) {
  switch (remark) {
    case "Excellent": return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "Very Good": return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    case "Good":      return "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30";
    case "Pass":      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "Fail":      return "bg-red-500/15 text-red-400 border border-red-500/30";
    default:          return "text-slate-400";
  }
}

function getGradeColor(grade) {
  switch (grade) {
    case "A":  return "text-emerald-300";
    case "B+": return "text-blue-300";
    case "B":  return "text-blue-300";
    case "C":  return "text-cyan-300";
    case "D":  return "text-amber-300";
    case "E":  return "text-amber-200";
    case "F":  return "text-red-400";
    default:   return "text-white";
  }
}

// ─── Tiny SVG for circular progress ─────────────────────────────────────────
function CircularProgress({ value, color, size = 36, stroke = 3 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/5" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  );
}

// ─── Standard Nigerian 5-Point Calculation Logic (Dynamic columns) ────────────
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
  const cgpa = gpa; // single semester view
  
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

import { useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CGPAGrid({ students, setStudents, courseColumns, setCourseColumns, onSave, isSaving, saveStatus, lastSaved }) {
  const [autoSave, setAutoSave] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // Structured editing modal
  const fileInputRef = useRef(null);

  // Live Sync / Auto Save Trigger with Debounce
  useEffect(() => {
    if (!autoSave || !onSave || students.length === 0) return;
    const delayDebounceFn = setTimeout(() => {
      onSave(students, courseColumns);
    }, 1500); // 1.5 seconds debounce
    return () => clearTimeout(delayDebounceFn);
  }, [students, courseColumns, autoSave]);

  // Dynamic Spreadsheet States
  const [isFrozen, setIsFrozen] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showFormulasModal, setShowFormulasModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    matric: true,
    dept: true,
    level: true,
    totalUnits: true,
    gpa: true,
    cgpa: true,
    grade: true,
    remarks: true,
  });

  // Dynamic Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(students.map((s) => s.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Cell update handler ──────────────────────────────────────────────────
  const handleCellChange = (id, field, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, [field]: value };
          return recomputeStudent(updated, courseColumns);
        }
        return s;
      })
    );
  };

  // ─── Header units update handler ──────────────────────────────────────────
  const handleUnitChange = (courseKey, newUnits) => {
    const updatedColumns = courseColumns.map(c => {
      if (c.key === courseKey) {
        return { ...c, units: newUnits };
      }
      return c;
    });
    setCourseColumns(updatedColumns);
    setStudents((prev) => prev.map((s) => recomputeStudent(s, updatedColumns)));
  };

  // ─── Add dynamic course column ──────────────────────────────────────────
  const addCourseColumn = () => {
    const code = prompt("Enter Course Code (e.g., GST102):");
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    
    if (courseColumns.some(c => c.label === cleanCode)) {
      alert("This course already exists!");
      return;
    }
    
    const unitsStr = prompt(`Enter Credit Units for ${cleanCode} (e.g., 3):`);
    const units = parseInt(unitsStr) || 3;
    
    const newKey = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const updatedColumns = [...courseColumns, { key: newKey, label: cleanCode, units }];
    setCourseColumns(updatedColumns);
    setStudents((prev) => prev.map((s) => recomputeStudent({ ...s, [newKey]: null }, updatedColumns)));
  };

  // ─── Add new student row ────────────────────────────────────────────────
  const addStudentRow = () => {
    const rawStudent = {
      id: Date.now(),
      name: "",
      matric: "",
      dept: "Computer Sci.",
      level: 200,
    };
    courseColumns.forEach(c => {
      rawStudent[c.key] = null;
    });

    const newStudent = recomputeStudent(rawStudent, courseColumns);
    setStudents((prev) => [...prev, newStudent]);
    
    // Jump to the last page where the new student is added
    const newTotalPages = Math.ceil((students.length + 1) / pageSize);
    setCurrentPage(newTotalPages);
  };

  // ─── Delete student row ─────────────────────────────────────────────────
  const deleteStudentRow = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    // Adjust current page if the deleted row leaves the page empty
    if (students.length % pageSize === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ─── Clear all records ──────────────────────────────────────────────────
  const clearAllRecords = () => {
    if (confirm("Are you sure you want to clear all student records?")) {
      setStudents([]);
      setSelectedRows(new Set());
      setSelectAll(false);
      setCurrentPage(1);
    }
  };

  // ─── Load mock sample data ──────────────────────────────────────────────
  const loadMockData = () => {
    const defaultCols = [
      { key: "csc101", label: "CSC101", units: 3 },
      { key: "mth101", label: "MTH101", units: 3 },
      { key: "gst101", label: "GST101", units: 2 },
    ];
    setCourseColumns(defaultCols);
    
    const populated = MOCK_STUDENTS.map((s) => {
      const row = {
        id: s.id,
        name: s.name,
        matric: s.matric,
        dept: s.dept,
        level: s.level,
        csc101: s.csc101,
        mth101: s.mth101,
        gst101: s.gst101,
      };
      return recomputeStudent(row, defaultCols);
    });
    setStudents(populated);
    setCurrentPage(1);
  };

  // ─── Save structured edit modal ──────────────────────────────────────────
  const saveEditedStudent = (e) => {
    e.preventDefault();
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === editingStudent.id) {
          return recomputeStudent(editingStudent, courseColumns);
        }
        return s;
      })
    );
    setEditingStudent(null);
  };

  // ─── CSV Export ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("No student records to export!");
      return;
    }
    const headers = [
      "Student Name",
      "Matric Number",
      "Department",
      "Level",
      ...courseColumns.map(c => `${c.label} (${c.units}U)`),
      "Total Units",
      "GPA",
      "CGPA",
      "Grade",
      "Remarks"
    ];
    const rows = students.map((s) => [
      s.name,
      s.matric,
      s.dept,
      s.level,
      ...courseColumns.map(c => s[c.key] !== null && s[c.key] !== undefined ? s[c.key] : ""),
      s.totalUnits,
      s.gpa.toFixed(2),
      s.cgpa.toFixed(2),
      s.grade,
      s.remarks
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CGPA_Spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── CSV Import ─────────────────────────────────────────────────────────
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length < 2) {
          alert("The file seems empty or invalid.");
          return;
        }

        const headers = lines[0].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const courseIndices = [];
        const importedCourses = [];
        
        for (let i = 4; i < headers.length; i++) {
          const h = headers[i];
          if (h === "Total Units" || h === "GPA" || h === "CGPA" || h === "Grade" || h === "Remarks") {
            break;
          }
          courseIndices.push(i);
          
          const match = h.match(/^([A-Z0-9]+)(?:\s*\((\d+)\s*U?\))?/i);
          const label = match ? match[1].toUpperCase() : h.toUpperCase();
          const units = match && match[2] ? parseInt(match[2]) : 3;
          const key = label.toLowerCase().replace(/[^a-z0-9]/g, "");
          
          importedCourses.push({ key, label, units });
        }
        
        if (importedCourses.length === 0) {
          alert("Could not detect any course columns in the CSV header!");
          return;
        }

        setCourseColumns(importedCourses);

        const importedStudents = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length < 4) continue;

          const rawStudent = {
            id: Date.now() + i,
            name: cols[0] || "",
            matric: cols[1] || "",
            dept: cols[2] || "",
            level: parseInt(cols[3]) || 200,
          };

          importedCourses.forEach((c, idx) => {
            const csvColIndex = courseIndices[idx];
            const scoreVal = cols[csvColIndex];
            rawStudent[c.key] = scoreVal === "" || scoreVal === undefined ? null : parseInt(scoreVal);
          });

          importedStudents.push(recomputeStudent(rawStudent, importedCourses));
        }

        setStudents(importedStudents);
        setCurrentPage(1);
        alert(`Successfully imported ${importedStudents.length} student records and ${importedCourses.length} course columns!`);
      } catch (err) {
        alert("Failed to parse CSV file. Error: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── Real-Time Footer Stats Calculation ───────────────────────────────────
  const totalStudentsCount = students.length;
  
  const gpas = students.map((s) => s.gpa).filter((g) => g !== null && g !== undefined && !isNaN(g));
  const averageGPA = gpas.length > 0 ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "0.00";

  const cgpas = students.map((s) => s.cgpa).filter((c) => c !== null && c !== undefined && !isNaN(c));
  const averageCGPA = cgpas.length > 0 ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : "0.00";

  const passCount = students.filter((s) => s.cgpa >= 1.00).length;
  const passRate = totalStudentsCount > 0 ? ((passCount / totalStudentsCount) * 100).toFixed(1) : "0.0";
  const failRate = totalStudentsCount > 0 ? (100 - parseFloat(passRate)).toFixed(1) : "0.0";

  // ─── Pagination Calculations ──────────────────────────────────────────────
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(students.length / pageSize) || 1;

  // ─── Toolbar button helper ───────────────────────────────────────────────
  const ToolbarBtn = ({ icon: Icon, label, className = "", onClick, active = false }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-[5px] rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
        active 
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
      } ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label && <span>{label}</span>}
    </button>
  );

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.06] overflow-hidden bg-[#0B1120] relative">
      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCSV}
        accept=".csv"
        style={{ display: "none" }}
      />

      {/* ═══ HEADER SECTION ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0d1323]">
        {/* Left — Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Table2 className="w-[18px] h-[18px] text-emerald-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white leading-tight tracking-tight">
              CGPA Spreadsheet <span className="text-slate-500 font-normal text-[13px]">(Excel View)</span>
            </h2>
          </div>
        </div>

        {/* Right — Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Import Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={addStudentRow}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Student
          </button>
        </div>
      </div>

      {/* ═══ TOOLBAR ROW ═════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0c1220] relative">
        {/* Left tools */}
        <div className="flex items-center gap-1.5">
          <ToolbarBtn icon={Undo2} />
          <ToolbarBtn icon={Redo2} />
          <div className="w-px h-5 bg-white/[0.06] mx-1" />
          <ToolbarBtn 
            icon={Lock} 
            label="Freeze Panes" 
            active={isFrozen} 
            onClick={() => setIsFrozen(!isFrozen)} 
            title="Freeze Name & Matric columns"
          />
          <ToolbarBtn icon={Filter} label="Filter" />
          <ToolbarBtn icon={ArrowUpDown} label="Sort" />
          <ToolbarBtn icon={Search} label="Find" />
          <ToolbarBtn icon={BookOpen} label="Add Course" onClick={addCourseColumn} className="border-cyan-500/20 text-cyan-400 hover:text-cyan-300" />
          <ToolbarBtn icon={X} label="Clear Sheet" onClick={clearAllRecords} />
          <ToolbarBtn icon={Database} label="Load Sample Data" onClick={loadMockData} className="border-emerald-500/20 text-emerald-400/90 hover:text-emerald-300" />
          <div className="w-px h-5 bg-white/[0.06] mx-1" />
          
          {/* Auto Save Toggle */}
          <button
            onClick={() => setAutoSave(!autoSave)}
            className="flex items-center gap-2 px-2.5 py-[5px] rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-medium text-slate-400">Auto Save</span>
            <div className="relative">
              {autoSave ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${autoSave ? "text-emerald-400" : "text-slate-600"}`}>
              {autoSave ? "ON" : "OFF"}
            </span>
          </button>

          {/* Cloud Sync Status Indicator */}
          {onSave && (
            <div className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-md border border-white/[0.06] bg-[#111927]/60 text-[10px] font-semibold tracking-wide">
              {saveStatus === "saving" && (
                <>
                  <div className="w-2 h-2 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span className="text-slate-400">SYNCING...</span>
                </>
              )}
              {saveStatus === "all-saved" && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></div>
                  <span className="text-emerald-400 uppercase">CLOUD SYNCED {lastSaved && `(${lastSaved})`}</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-red-400 uppercase">SYNC ERROR</span>
                </>
              )}
              {!autoSave && saveStatus !== "saving" && (
                <button
                  onClick={() => onSave(students, courseColumns)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase cursor-pointer"
                >
                  SAVE NOW
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1.5 relative">
          
          {/* Column Visibility Selector */}
          <div className="relative">
            <ToolbarBtn 
              icon={Columns3} 
              label="Columns" 
              active={showColumnsDropdown}
              onClick={() => {
                setShowColumnsDropdown(!showColumnsDropdown);
                setShowFormulasModal(false);
              }}
            />
            {showColumnsDropdown && (
              <div className="absolute top-8 right-0 w-48 bg-[#0d1323] border border-white/[0.08] rounded-xl shadow-2xl p-3 z-50 animate-fade-in text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-2">Toggle Columns</span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {Object.keys(visibleColumns).map((key) => (
                    <label key={key} className="flex items-center gap-2 px-1 py-0.5 hover:bg-white/[0.02] cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="w-3.5 h-3.5 rounded border-slate-600 bg-transparent accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ToolbarBtn icon={Settings} />
          
          <ToolbarBtn 
            icon={Calculator} 
            label="Formulas" 
            onClick={() => {
              setShowFormulasModal(true);
              setShowColumnsDropdown(false);
            }} 
          />
        </div>
      </div>

      {/* ═══ DATA GRID ═══════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs border-collapse min-w-[1400px]">
          {/* ── Table Head ───────────────────────────────────────────────── */}
          <thead>
            <tr className="bg-[#0d1323] text-[11px] text-slate-500 uppercase tracking-wider select-none">
              <th className="px-3 py-2.5 text-center font-semibold w-10 border-b border-white/[0.05]">#</th>
              <th className="px-2 py-2.5 text-center font-semibold w-10 border-b border-white/[0.05]">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-transparent accent-emerald-500 cursor-pointer"
                />
              </th>
              
              {visibleColumns.name && (
                <th className={`px-3 py-2.5 text-left font-semibold border-b border-white/[0.05] min-w-[180px] ${
                  isFrozen ? "sticky left-0 bg-[#0d1323] z-20 border-r border-white/10" : ""
                }`}>
                  Student Name
                </th>
              )}

              {visibleColumns.matric && (
                <th className={`px-3 py-2.5 text-left font-semibold border-b border-white/[0.05] min-w-[130px] ${
                  isFrozen ? "sticky left-[180px] bg-[#0d1323] z-20 border-r border-white/10" : ""
                }`}>
                  Matric Number
                </th>
              )}

              {visibleColumns.dept && (
                <th className="px-3 py-2.5 text-left font-semibold border-b border-white/[0.05] min-w-[140px]">Department</th>
              )}

              {visibleColumns.level && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-20">Level</th>
              )}

              {courseColumns.map((c) => (
                <th key={c.key} className="px-3 py-2 border-b border-white/[0.05] min-w-[110px] text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-bold text-slate-300 tracking-wide">{c.label}</span>
                    <div className="flex items-center gap-1 mt-0.5 justify-center">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={c.units}
                        onChange={(e) => handleUnitChange(c.key, parseInt(e.target.value) || 1)}
                        className="w-8 bg-white/5 border border-white/10 rounded text-center text-[10px] text-emerald-400/90 font-bold focus:outline-none focus:border-emerald-500/50 py-0.5"
                      />
                      <span className="text-[8px] text-slate-500 font-semibold tracking-tight">Units</span>
                    </div>
                  </div>
                </th>
              ))}

              {visibleColumns.totalUnits && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-20">Total Units</th>
              )}

              {visibleColumns.gpa && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-16">GPA</th>
              )}

              {visibleColumns.cgpa && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-16">CGPA</th>
              )}

              {visibleColumns.grade && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-16">Grade</th>
              )}

              {visibleColumns.remarks && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] min-w-[110px]">Remarks</th>
              )}

              <th className="px-3 py-2.5 text-center font-semibold border-b border-white/[0.05] w-20">Actions</th>
            </tr>
          </thead>

          {/* ── Table Body ───────────────────────────────────────────────── */}
          <tbody>
            {paginatedStudents.map((s, idx) => (
              <tr
                key={s.id}
                className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${selectedRows.has(s.id) ? "bg-emerald-500/[0.04]" : ""}`}
              >
                {/* Row Number */}
                <td className="px-3 py-2.5 text-center text-slate-600 font-mono text-[11px]">{startIndex + idx + 1}</td>

                {/* Checkbox */}
                <td className="px-2 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(s.id)}
                    onChange={() => toggleRow(s.id)}
                    className="w-3.5 h-3.5 rounded border-slate-600 bg-transparent accent-emerald-500 cursor-pointer"
                  />
                </td>

                {/* Student Name */}
                {visibleColumns.name && (
                  <td className={`px-3 py-2.5 ${isFrozen ? "sticky left-0 bg-[#0B1120] z-10 border-r border-white/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/80 to-blue-500/80 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <input
                        type="text"
                        value={s.name}
                        placeholder="Student Name"
                        onChange={(e) => handleCellChange(s.id, "name", e.target.value)}
                        className="bg-transparent border-none text-white font-medium text-[12.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1.5 py-0.5 w-full"
                      />
                    </div>
                  </td>
                )}

                {/* Matric */}
                {visibleColumns.matric && (
                  <td className={`px-3 py-2.5 ${isFrozen ? "sticky left-[180px] bg-[#0B1120] z-10 border-r border-white/5" : ""}`}>
                    <input
                      type="text"
                      value={s.matric}
                      placeholder="Matric Number"
                      onChange={(e) => handleCellChange(s.id, "matric", e.target.value)}
                      className="bg-transparent border-none text-slate-400 font-mono text-[11.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1.5 py-0.5 w-full"
                    />
                  </td>
                )}

                {/* Department */}
                {visibleColumns.dept && (
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={s.dept}
                      placeholder="Department"
                      onChange={(e) => handleCellChange(s.id, "dept", e.target.value)}
                      className="bg-transparent border-none text-slate-400 text-[12px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1.5 py-0.5 w-full"
                    />
                  </td>
                )}

                {/* Level */}
                {visibleColumns.level && (
                  <td className="px-3 py-2.5 text-center">
                    <select
                      value={s.level}
                      onChange={(e) => handleCellChange(s.id, "level", parseInt(e.target.value) || 200)}
                      className="bg-transparent border-none text-slate-300 text-center font-medium text-[12px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1.5 py-0.5 w-full cursor-pointer appearance-none"
                    >
                      <option value={100} className="bg-[#0B1120] text-white">100 Lvl</option>
                      <option value={200} className="bg-[#0B1120] text-white">200 Lvl</option>
                      <option value={300} className="bg-[#0B1120] text-white">300 Lvl</option>
                      <option value={400} className="bg-[#0B1120] text-white">400 Lvl</option>
                      <option value={500} className="bg-[#0B1120] text-white">500 Lvl</option>
                    </select>
                  </td>
                )}

                {/* Course Scores */}
                {courseColumns.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={s[c.key] === null || s[c.key] === undefined ? "" : s[c.key]}
                      placeholder="—"
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : parseInt(e.target.value);
                        handleCellChange(s.id, c.key, val);
                      }}
                      className={`bg-transparent border-none text-center font-medium text-[12.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded px-1 py-0.5 w-14 mx-auto block ${getScoreClasses(s[c.key])}`}
                    />
                  </td>
                ))}

                {/* Total Units */}
                {visibleColumns.totalUnits && (
                  <td className="px-3 py-2.5 text-center text-slate-300 font-semibold text-[12px]">{s.totalUnits}</td>
                )}

                {/* GPA */}
                {visibleColumns.gpa && (
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-white font-semibold text-[12.5px]">{s.gpa.toFixed(2)}</span>
                  </td>
                )}

                {/* CGPA */}
                {visibleColumns.cgpa && (
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-white font-semibold text-[12.5px]">{s.cgpa.toFixed(2)}</span>
                  </td>
                )}

                {/* Grade */}
                {visibleColumns.grade && (
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold text-[12.5px] ${getGradeColor(s.grade)}`}>{s.grade}</span>
                  </td>
                )}

                {/* Remarks */}
                {visibleColumns.remarks && (
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getRemarksClasses(s.remarks)}`}>
                      {s.remarks}
                    </span>
                  </td>
                )}

                {/* Actions */}
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setEditingStudent({ ...s })}
                      className="p-1.5 rounded-md hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer border-none bg-transparent"
                      title="Edit Student"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteStudentRow(s.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent"
                      title="Delete Student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* ── Empty "Add New" Row ─────────────────────────────────────── */}
            <tr
              onClick={addStudentRow}
              className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors group"
            >
              <td className="px-3 py-3 text-center text-slate-700 font-mono text-[11px]">{students.length + 1}</td>
              <td className="px-2 py-3" />
              <td colSpan={15} className="px-3 py-3">
                <span className="text-slate-600 italic text-[12px] group-hover:text-slate-400 transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" /> Click to add a new student record...
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ FOOTER BAR ══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-[#0c1220] select-none">
        
        {/* Left — Showing count */}
        <p className="text-[11.5px] text-slate-500 shrink-0">
          {totalStudentsCount === 0 ? (
            <span>No student records found</span>
          ) : (
            <span>
              Showing <span className="text-slate-300 font-medium">{startIndex + 1}</span> to{" "}
              <span className="text-slate-300 font-medium">{Math.min(startIndex + pageSize, totalStudentsCount)}</span> of{" "}
              <span className="text-slate-300 font-medium">{totalStudentsCount}</span> students
            </span>
          )}
        </p>

        {/* Center — Summary stat cards */}
        <div className="flex items-center gap-3">
          {/* Total Students */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131b2e] border border-white/[0.06] rounded-md">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Total Students</span>
              <span className="text-sm font-bold text-white mt-0.5">{totalStudentsCount}</span>
            </div>
            <Users className="w-3.5 h-3.5 text-blue-400 opacity-60 ml-1" />
          </div>

          {/* Average GPA */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131b2e] border border-white/[0.06] rounded-md">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Average GPA</span>
              <span className="text-sm font-bold text-white mt-0.5">{averageGPA}</span>
            </div>
            <svg width="24" height="12" viewBox="0 0 24 12" className="ml-1 opacity-60 shrink-0">
              <path d="M2,10 Q6,3 10,7 T18,3 T22,1" fill="none" stroke="#10b981" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Average CGPA */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131b2e] border border-white/[0.06] rounded-md">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Average CGPA</span>
              <span className="text-sm font-bold text-white mt-0.5">{averageCGPA}</span>
            </div>
            <svg width="24" height="12" viewBox="0 0 24 12" className="ml-1 opacity-60 shrink-0">
              <path d="M2,9 Q6,8 10,4 T18,7 T22,2" fill="none" stroke="#a855f7" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Pass Rate */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131b2e] border border-white/[0.06] rounded-md">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Pass Rate</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5">{passRate}%</span>
            </div>
            <CircularProgress value={parseFloat(passRate)} color="#10b981" size={18} stroke={2} />
          </div>

          {/* Fail Rate */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131b2e] border border-white/[0.06] rounded-md">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Fail Rate</span>
              <span className="text-sm font-bold text-red-400 mt-0.5">{failRate}%</span>
            </div>
            <CircularProgress value={parseFloat(failRate)} color="#ef4444" size={18} stroke={2} />
          </div>
        </div>

        {/* Right — Dynamic Pagination Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  p === currentPage
                    ? "bg-emerald-600 text-white"
                    : "border border-white/[0.06] bg-white/[0.02] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ STRUCTURED EDIT STUDENT MODAL ═══════════════════════════════════ */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0d1323] p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Student Details</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveEditedStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-blue-500 text-xs w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Matric Number</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.matric}
                    onChange={(e) => setEditingStudent({ ...editingStudent, matric: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-blue-500 text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Department</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.dept}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dept: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-blue-500 text-xs w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Level</label>
                  <select
                    value={editingStudent.level}
                    onChange={(e) => setEditingStudent({ ...editingStudent, level: parseInt(e.target.value) || 200 })}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-[#0c1220] text-white focus:outline-none focus:border-blue-500 text-xs w-full cursor-pointer"
                  >
                    <option value={100}>100 Lvl</option>
                    <option value={200}>200 Lvl</option>
                    <option value={300}>300 Lvl</option>
                    <option value={400}>400 Lvl</option>
                    <option value={500}>500 Lvl</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-3">
                <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold mb-2.5">Course Scores</h4>
                <div className="grid grid-cols-3 gap-3">
                  {courseColumns.map((c) => (
                    <div key={c.key} className="flex flex-col gap-1 bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-lg">
                      <label className="text-[10px] text-slate-300 font-semibold flex items-center justify-between">
                        <span>{c.label}</span>
                        <span className="text-[8px] text-slate-500 font-normal">({c.units}U)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingStudent[c.key] === null || editingStudent[c.key] === undefined ? "" : editingStudent[c.key]}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseInt(e.target.value);
                          setEditingStudent({ ...editingStudent, [c.key]: val });
                        }}
                        className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-center font-semibold text-xs w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/[0.04] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ FORMULAS EXPLANATION MODAL ══════════════════════════════════════ */}
      {showFormulasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0d1323] p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Academic Formula Guide</h3>
              </div>
              <button
                onClick={() => setShowFormulasModal(false)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">GPA Formula</span>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg font-mono text-center text-white">
                  GPA = Sum(Grade Point × Credit Units) / Total Units
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">Grading Scale (Nigerian 5.0 scale)</span>
                <div className="grid grid-cols-2 gap-2 bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg">
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span className="text-slate-400">70 - 100% (A)</span>
                    <strong className="text-emerald-400">5.0 GP</strong>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span className="text-slate-400">60 - 69% (B)</span>
                    <strong className="text-blue-400">4.0 GP</strong>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span className="text-slate-400">50 - 59% (C)</span>
                    <strong className="text-cyan-400">3.0 GP</strong>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1">
                    <span className="text-slate-400">45 - 49% (D)</span>
                    <strong className="text-amber-400">2.0 GP</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">40 - 44% (E)</span>
                    <strong className="text-amber-200">1.0 GP</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">0 - 39% (F)</span>
                    <strong className="text-red-400">0.0 GP</strong>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">Class Classifications</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                  <li><strong className="text-white">First Class Honors:</strong> 4.50 – 5.00 CGPA</li>
                  <li><strong className="text-white">Second Class Upper:</strong> 3.50 – 4.49 CGPA</li>
                  <li><strong className="text-white">Second Class Lower:</strong> 2.40 – 3.49 CGPA</li>
                  <li><strong className="text-white">Third Class:</strong> 1.50 – 2.39 CGPA</li>
                  <li><strong className="text-white">Pass Class:</strong> 1.00 – 1.49 CGPA</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-white/[0.06] pt-4 mt-5">
              <button
                onClick={() => setShowFormulasModal(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
