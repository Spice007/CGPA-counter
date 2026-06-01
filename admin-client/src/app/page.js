"use client";
import React, { useState } from "react";
import StatCards from "@/components/dashboard/StatCards";
import CGPAGrid from "@/components/spreadsheet/CGPAGrid";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [courseColumns, setCourseColumns] = useState([
    { key: "csc101", label: "CSC101", units: 3 },
    { key: "mth101", label: "MTH101", units: 3 },
    { key: "gst101", label: "GST101", units: 2 },
  ]);

  return (
    <div className="max-w-full mx-auto pb-8">
      <StatCards students={students} courseColumns={courseColumns} />
      <CGPAGrid 
        students={students} 
        setStudents={setStudents} 
        courseColumns={courseColumns} 
        setCourseColumns={setCourseColumns} 
      />
    </div>
  );
}
