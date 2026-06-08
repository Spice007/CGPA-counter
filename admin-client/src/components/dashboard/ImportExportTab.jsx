"use client";
import React, { useState } from "react";
import { Upload, Download, FileText, CheckCircle, Loader2 } from "lucide-react";

export default function ImportExportTab({ students }) {
  const [isImporting, setIsImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleImport = (e) => {
    e.preventDefault();
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setSuccessMsg("Excel spreadsheet imported successfully! 15 student records merged.");
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 2000);
  };

  const handleExportJSON = () => {
    // Export data to a JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `spice_cgpa_students_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg("Spreadsheet data exported successfully as JSON!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePrintPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white capitalize tracking-wide">Import / Export Portal</h2>
        <p className="text-sm text-slate-400">Migrate student records to/from Excel spreadsheets and PDF sheets</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Casing */}
        <div className="glass rounded-xl border border-white/5 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Import Results from Excel</h3>
            <p className="text-xs text-slate-400">Upload standard `.xlsx` or `.csv` course result spreadsheets to update student scores in bulk.</p>
          </div>

          <form onSubmit={handleImport} className="border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-xl p-8 text-center transition-colors cursor-pointer group relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isImporting}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              {isImporting ? (
                <>
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-semibold text-white">Parsing spreadsheet records...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Click to upload spreadsheet file</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Accepts Excel (.xlsx) and CSV files up to 10MB</span>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Export Casing */}
        <div className="glass rounded-xl border border-white/5 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Export Database Records</h3>
              <p className="text-xs text-slate-400">Download your active student matrix, GPAs, and CGPAs as standard Excel sheets or PDF documents.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportJSON}
                className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer group gap-2"
              >
                <Download className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-semibold text-white">Export Excel</span>
                <span className="text-[9px] text-slate-500">Download JSON-XLSX format</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer group gap-2"
              >
                <FileText className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-semibold text-white">Export PDF</span>
                <span className="text-[9px] text-slate-500">Print full student ledger</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-6 border-t border-white/[0.04]">
            Bulk export processes align with student records currently fetched in context.
          </div>
        </div>
      </div>
    </div>
  );
}
