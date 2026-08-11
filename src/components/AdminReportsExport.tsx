import React, { useState, useRef } from "react";
import { FileSpreadsheet, FolderOpen, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useChurch } from "../context/ChurchContext";

export const AdminReports: React.FC = () => {
  const { members, events, attendance } = useChurch();

  const handleDownloadCSV = (reportType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `${reportType.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === "Membership Directory") {
      csvContent += "ID,First Name,Last Name,Email,Phone,Status,Joined Date,Suburb,Ministries\n";
      members.forEach(m => {
        const mins = m.ministries ? `"${m.ministries.join(', ')}"` : "";
        csvContent += `${m.id},${m.firstName},${m.lastName},${m.email},${m.phone},${m.status},${m.joinedDate},"${m.suburb}",${mins}\n`;
      });
    } else if (reportType === "Weekly Attendance Summary") {
      csvContent += "Event Date,Service Name,Member Name,Member Email\n";
      attendance.forEach(a => {
        csvContent += `${a.date},"${a.serviceName}","${a.memberName}",${a.memberEmail}\n`;
      });
    } else {
      csvContent += "Note\nReport generation for this type is not yet fully implemented.\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (reportType: string) => {
    alert(`Previewing ${reportType}\n(In a production environment, this would open a PDF or data table modal)`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Reports & Exports
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Generate CSV/PDF reports for Membership, Attendance, and Operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Weekly Attendance Summary", desc: "Breakdown of Sunday, Midweek, and Kids Church." },
          { title: "Membership Directory", desc: "Full contact list of active church members." },
          { title: "First-Time Visitors (Monthly)", desc: "List of new visitors and their follow-up status." },
          { title: "Volunteer Roster Export", desc: "Upcoming month's scheduled volunteers across all ministries." },
          { title: "Inactive Members", desc: "Members who have not checked in for over 4 weeks." }
        ].map((report, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-[#1e1548]">{report.title}</h3>
              </div>
              <p className="text-[10px] text-neutral-500">{report.desc}</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3">
              <button onClick={() => handlePreview(report.title)} className="text-[9px] font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 px-3 py-1 rounded uppercase cursor-pointer">Preview</button>
              <button onClick={() => handleDownloadCSV(report.title)} className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded uppercase cursor-pointer flex items-center gap-1"><Download className="w-3 h-3"/> CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminImportExport: React.FC = () => {
  const { bulkAddMembers, members, attendance } = useChurch();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setStatus("idle");
      } else {
        setStatus("error");
        setErrorMessage("Only CSV files are supported.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleImport = () => {
    if (!file) {
      setStatus("error");
      setErrorMessage("Please select a file first.");
      return;
    }
    
    setStatus("validating");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (text && typeof text === 'string') {
         const lines = text.split('\n').filter(l => l.trim().length > 0);
         if (lines.length > 1) {
           const newMembers = lines.slice(1).map(line => {
             // Basic naive CSV parsing
             const parts = line.split(',');
             return {
               firstName: parts[0] || "",
               lastName: parts[1] || "",
               email: parts[2] || "",
               phone: parts[3] || "",
               suburb: parts[4] || "Unknown",
               status: (parts[5] === "Inactive" ? "Inactive" : "Active") as "Active" | "Inactive"
             };
           });
           
           bulkAddMembers(newMembers);
           setStatus("success");
         } else {
           setStatus("error");
           setErrorMessage("File is empty or missing data rows.");
         }
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    const csvContent = "data:text/csv;charset=utf-8,FirstName,LastName,Email,Phone,Suburb,Status\nJohn,Doe,john@example.com,0821234567,Sandton,Active\nJane,Smith,jane@example.com,0729876543,Rosebank,Active\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Members_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1548] tracking-tight font-sans">
            Data Portability
          </h1>
          <p className="text-xs text-neutral-400 font-semibold max-w-2xl mt-1">
            Securely import or export data via CSV templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMPORT SECTION */}
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-2 border-b border-neutral-100 pb-2">Import Data</h2>
          <p className="text-xs text-neutral-500 mb-4">Upload a CSV template to bulk insert records into the database.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Target Collection</label>
              <select >
                <option>Members Directory</option>
                <option>Visitors Log</option>
                <option>Small Groups</option>
              </select>
            </div>
            
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed p-8 rounded-xl text-center transition-colors cursor-pointer ${dragActive ? "border-blue-500 bg-blue-50" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"}`}
            >
              <input type="file" ref={inputRef} onChange={handleChange} accept=".csv" className="hidden" />
              
              {file ? (
                <div className="text-emerald-600 font-bold text-sm flex flex-col items-center">
                   <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                   {file.name}
                   <span className="text-[10px] text-neutral-500 mt-1 font-normal">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ) : (
                <>
                  <FolderOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-600">Drag & Drop CSV file here</p>
                  <p className="text-[10px] text-neutral-400 mt-1">or click to browse</p>
                </>
              )}
            </div>
            
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" /> {errorMessage}
              </div>
            )}
            
            {status === 'success' && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded text-xs flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4" /> Data successfully imported!
              </div>
            )}
            
            <button 
              onClick={handleImport}
              disabled={status === 'validating'}
              className="btn-primary-sm w-full"
            >
              {status === 'validating' ? 'Validating...' : 'Validate & Import'}
            </button>
            <div className="text-center">
              <a href="#" onClick={handleDownloadTemplate} className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">Download CSV Template</a>
            </div>
          </div>
        </div>

        {/* EXPORT SECTION */}
        <div className="bg-white border border-neutral-200 shadow-xs rounded-xl p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-2 border-b border-neutral-100 pb-2">Export Data</h2>
          <p className="text-xs text-neutral-500 mb-4">Download system records. Exports are permanently logged in the Audit Trail.</p>
          
          <div className="space-y-3">
            {[
              { name: "Full Membership Directory", format: "CSV" },
              { name: "Year-to-Date Attendance", format: "CSV" },
              { name: "Financial Giving Ledger", format: "CSV (Requires Finance Role)" },
              { name: "Follow-up Queue History", format: "CSV" }
            ].map((exp, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-800">{exp.name}</p>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-widest">{exp.format}</p>
                </div>
                <button 
                  onClick={() => {
                    let csvContent = `data:text/csv;charset=utf-8,Export Type,${exp.name}\nTimestamp,${new Date().toISOString()}\n\n`;
                    if (exp.name === "Full Membership Directory") {
                      csvContent += "ID,First Name,Last Name,Email,Phone,Status,Joined Date,Suburb,Ministries\n";
                      members.forEach(m => {
                        const mins = m.ministries ? `"${m.ministries.join(', ')}"` : "";
                        csvContent += `${m.id},${m.firstName},${m.lastName},${m.email},${m.phone},${m.status},${m.joinedDate},"${m.suburb}",${mins}\n`;
                      });
                    } else if (exp.name === "Year-to-Date Attendance") {
                      csvContent += "Event Date,Service Name,Member Name,Member Email\n";
                      attendance.forEach(a => {
                        csvContent += `${a.date},"${a.serviceName}","${a.memberName}",${a.memberEmail}\n`;
                      });
                    }
                    const link = document.createElement("a");
                    link.setAttribute("href", encodeURI(csvContent));
                    link.setAttribute("download", `${exp.name.replace(/\s+/g, '_')}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-600 p-2 rounded transition-colors cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
