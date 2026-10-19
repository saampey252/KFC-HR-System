import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Table,
  Building,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Employee, Department } from '../../types';
import {
  exportEmployeesToExcel,
  downloadEmployeeImportTemplate,
  parseExcelFile,
  ParseResult,
} from '../../utils/excelUtils';
import { addEmployee, logAudit } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface ReportsExportViewProps {
  employees: Employee[];
  departments: Department[];
}

export const ReportsExportView: React.FC<ReportsExportViewProps> = ({
  employees,
  departments,
}) => {
  const { user } = useAuth();
  const [importResult, setImportResult] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelFile(buffer);
      setImportResult(parsed);
      setImportStatus(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to parse Excel file');
    }
  };

  const handleCommitImport = async () => {
    if (!importResult || importResult.employees.length === 0) return;
    setIsImporting(true);
    setImportStatus('Importing records to Cloud Firestore...');

    try {
      for (const emp of importResult.employees) {
        await addEmployee(emp, actorInfo);
      }
      await logAudit(
        'IMPORT_EXCEL',
        `Bulk imported ${importResult.employees.length} employee records from Excel spreadsheet`,
        actorInfo
      );
      setImportStatus(
        `Success: Successfully imported ${importResult.employees.length} employees into KFC HR database.`
      );
      setImportResult(null);
    } catch (err: unknown) {
      setImportStatus(
        `Error during import: ${err instanceof Error ? err.message : 'Database error'}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          HR Compliance Reports &amp; Excel Interchange
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export standardized spreadsheets for Maldives Ministry audits or bulk-import employee rosters.
        </p>

        {/* Export Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">
                Master Employee Registry (.xlsx)
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Full personnel database including IDs, nationalities, departments, quarters, and document expiries.
              </p>
            </div>
            <button
              onClick={() => exportEmployeesToExcel(employees, 'KFC_Master_Employee_Registry')}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Download Master Excel</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">
                Document Expiry Audit Sheet (.xlsx)
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Specialized compliance report showing all expired and &le;30-day expiring permits, visas &amp; medicals.
              </p>
            </div>
            <button
              onClick={() =>
                exportEmployeesToExcel(
                  employees.filter((e) => !e.isArchived),
                  'KFC_Compliance_Expiry_Audit'
                )
              }
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Download className="h-4 w-4 text-amber-600" />
              <span>Download Compliance Audit</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Table className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">
                Import Template (.xlsx)
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Download the official pre-formatted Excel template with sample rows and column definitions for upload.
              </p>
            </div>
            <button
              onClick={downloadEmployeeImportTemplate}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Get Blank Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Excel Import Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Excel Employee Roster Import</h3>
            <p className="text-xs text-slate-500">
              Upload spreadsheets (.xlsx, .xls) to register or update batch personnel in Cloud Firestore.
            </p>
          </div>
        </div>

        {importStatus && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-medium ${
              importStatus.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {importStatus}
          </div>
        )}

        <div className="mt-5">
          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">
              Click to choose Excel spreadsheet or drag and drop
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Supports .xlsx and .xls (Max 5MB)
            </span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Parsed Preview Table */}
        {importResult && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Spreadsheet Analysis
                </h4>
                <p className="text-xs text-slate-600">
                  Ready to import: <strong>{importResult.employees.length}</strong> records (from {importResult.totalRows} rows)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportResult(null)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={isImporting || importResult.employees.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isImporting ? 'Importing...' : 'Confirm & Write to Firestore'}</span>
                </button>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <strong className="block mb-1 font-semibold">Row Warnings:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>...and {importResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Nationality</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Work Permit</th>
                    <th className="py-2.5 px-3">WP Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.employees.slice(0, 5).map((emp, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold">{emp.employeeId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{emp.nationality}</td>
                      <td className="py-2.5 px-3 text-slate-600">{emp.departmentName}</td>
                      <td className="py-2.5 px-3 font-mono">{emp.workPermitNumber || '—'}</td>
                      <td className="py-2.5 px-3 font-mono">{emp.workPermitExpiry || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importResult.employees.length > 5 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50/50">
                  Showing first 5 of {importResult.employees.length} parsed records.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
