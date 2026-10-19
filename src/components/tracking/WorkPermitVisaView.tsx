import React, { useState, useMemo } from 'react';
import {
  FileBadge,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Edit2,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { Employee } from '../../types';
import { evaluateExpiry, formatDate } from '../../utils/dateUtils';
import { exportEmployeesToExcel } from '../../utils/excelUtils';
import { updateEmployee } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface WorkPermitVisaViewProps {
  employees: Employee[];
  onOpenEditModal: (emp: Employee) => void;
  onOpenProfileDrawer: (emp: Employee) => void;
}

export const WorkPermitVisaView: React.FC<WorkPermitVisaViewProps> = ({
  employees,
  onOpenEditModal,
  onOpenProfileDrawer,
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'expired' | 'critical' | 'warning' | 'valid'>('all');
  const [search, setSearch] = useState('');

  // Quick Renew Modal
  const [renewingEmp, setRenewingEmp] = useState<Employee | null>(null);
  const [newWpExpiry, setNewWpExpiry] = useState('');
  const [newVisaExpiry, setNewVisaExpiry] = useState('');
  const [newWpNumber, setNewWpNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter expatriates only or those with work permit records
  const expatEmployees = useMemo(() => {
    return employees.filter(
      (e) => !e.isArchived && !e.nationality.toLowerCase().includes('maldiv')
    );
  }, [employees]);

  const filteredList = useMemo(() => {
    return expatEmployees.filter((emp) => {
      const wpEval = evaluateExpiry(emp.workPermitExpiry);
      const visaEval = evaluateExpiry(emp.visaExpiry);

      if (filterType === 'expired') {
        if (wpEval.status !== 'expired' && visaEval.status !== 'expired') return false;
      } else if (filterType === 'critical') {
        if (wpEval.status !== 'critical' && visaEval.status !== 'critical') return false;
      } else if (filterType === 'warning') {
        if (wpEval.status !== 'warning' && visaEval.status !== 'warning') return false;
      } else if (filterType === 'valid') {
        if (wpEval.status !== 'valid' || visaEval.status !== 'valid') return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const match =
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          (emp.workPermitNumber && emp.workPermitNumber.toLowerCase().includes(q)) ||
          emp.passportNumber.toLowerCase().includes(q) ||
          emp.nationality.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [expatEmployees, filterType, search]);

  const expiredCount = expatEmployees.filter((e) => {
    const wp = evaluateExpiry(e.workPermitExpiry);
    const v = evaluateExpiry(e.visaExpiry);
    return wp.status === 'expired' || v.status === 'expired';
  }).length;

  const criticalCount = expatEmployees.filter((e) => {
    const wp = evaluateExpiry(e.workPermitExpiry);
    const v = evaluateExpiry(e.visaExpiry);
    return (
      (wp.status === 'critical' || v.status === 'critical') &&
      wp.status !== 'expired' &&
      v.status !== 'expired'
    );
  }).length;

  const handleOpenRenew = (emp: Employee) => {
    setRenewingEmp(emp);
    setNewWpNumber(emp.workPermitNumber || '');
    setNewWpExpiry(emp.workPermitExpiry || '');
    setNewVisaExpiry(emp.visaExpiry || '');
  };

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingEmp) return;
    setIsSaving(true);
    try {
      await updateEmployee(
        renewingEmp.id,
        {
          workPermitNumber: newWpNumber,
          workPermitExpiry: newWpExpiry,
          visaExpiry: newVisaExpiry,
          notes: `${renewingEmp.notes ? renewingEmp.notes + ' | ' : ''}Work permit/visa renewed on ${new Date().toISOString().slice(0, 10)}`,
        },
        {
          email: user?.email || 'hr.admin@kooddoo.mv',
          name: user?.displayName || 'HR Administrator',
        }
      );
      setRenewingEmp(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update renewal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expat Workforce
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <FileBadge className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{expatEmployees.length}</span>
            <span className="text-xs font-medium text-slate-500">Foreign Specialists</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Maldives Ministry of Homeland Security Quota Registered
          </p>
        </div>

        <div
          onClick={() => setFilterType('expired')}
          className="cursor-pointer rounded-2xl border border-red-200 bg-white p-5 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Expired Permits
            </span>
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{expiredCount}</span>
            <span className="text-xs font-medium text-red-600/80">Immediate fine risk</span>
          </div>
          <p className="mt-2 text-[11px] text-red-600 font-medium">
            Click to filter expired work permits &amp; visas
          </p>
        </div>

        <div
          onClick={() => setFilterType('critical')}
          className="cursor-pointer rounded-2xl border border-amber-200 bg-white p-5 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Expiring &le; 30 Days
            </span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{criticalCount}</span>
            <span className="text-xs font-medium text-amber-700">Submit XPAT renewal</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800 font-medium">
            Click to filter permits expiring this month
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Foreign Staff ({expatEmployees.length})
          </button>
          <button
            onClick={() => setFilterType('expired')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'expired'
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'critical'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Expiring &le; 30d ({criticalCount})
          </button>
          <button
            onClick={() => setFilterType('valid')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'valid'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Compliant / Valid
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permit #, name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => exportEmployeesToExcel(filteredList, 'KFC_WorkPermits_Report')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Nationality &amp; Passport</th>
                <th className="py-3 px-4">Work Permit Number</th>
                <th className="py-3 px-4">WP Expiry</th>
                <th className="py-3 px-4">XPAT Visa Expiry</th>
                <th className="py-3 px-4">Status &amp; Countdown</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No work permit records matched your filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => {
                  const wpEval = evaluateExpiry(emp.workPermitExpiry);
                  const visaEval = evaluateExpiry(emp.visaExpiry);

                  return (
                    <tr
                      key={emp.id}
                      onDoubleClick={() => onOpenProfileDrawer(emp)}
                      title="Double-click to view staff profile"
                      className="hover:bg-blue-50/40 transition cursor-pointer select-none"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700 text-xs">
                            {emp.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.fullName}</p>
                            <p className="text-[11px] text-slate-500">
                              {emp.employeeId} • {emp.jobTitle}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{emp.nationality}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {emp.passportNumber}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {emp.workPermitNumber || 'Missing WP #'}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-semibold">{formatDate(emp.workPermitExpiry)}</span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-semibold">{formatDate(emp.visaExpiry)}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            wpEval.status === 'expired'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : wpEval.status === 'critical'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {wpEval.label}
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRenew(emp)}
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Renew</span>
                          </button>
                          <button
                            onClick={() => onOpenProfileDrawer(emp)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Renew Modal */}
      {renewingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Renew Work Permit &amp; XPAT Visa
                </h3>
                <p className="text-xs text-slate-500">
                  {renewingEmp.fullName} ({renewingEmp.employeeId})
                </p>
              </div>
              <button
                onClick={() => setRenewingEmp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Permit Number
                </label>
                <input
                  type="text"
                  required
                  value={newWpNumber}
                  onChange={(e) => setNewWpNumber(e.target.value)}
                  placeholder="e.g. WP-MV-2024-XXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Work Permit Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={newWpExpiry}
                  onChange={(e) => setNewWpExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New XPAT Visa Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={newVisaExpiry}
                  onChange={(e) => setNewVisaExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRenewingEmp(null)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Record Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
