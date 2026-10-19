import React, { useState, useMemo } from 'react';
import {
  FileHeart,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Employee } from '../../types';
import { evaluateExpiry, formatDate } from '../../utils/dateUtils';
import { exportEmployeesToExcel } from '../../utils/excelUtils';
import { updateEmployee } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface PassportMedicalViewProps {
  employees: Employee[];
  onOpenProfileDrawer: (emp: Employee) => void;
}

export const PassportMedicalView: React.FC<PassportMedicalViewProps> = ({
  employees,
  onOpenProfileDrawer,
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'expired' | 'critical' | 'valid'>('all');
  const [search, setSearch] = useState('');

  // Quick Renewal Modal for Passport or Medical
  const [renewingEmp, setRenewingEmp] = useState<Employee | null>(null);
  const [renewType, setRenewType] = useState<'passport' | 'medical'>('passport');
  const [newPassportNo, setNewPassportNo] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeEmployees = useMemo(() => employees.filter((e) => !e.isArchived), [employees]);

  const filteredList = useMemo(() => {
    return activeEmployees.filter((emp) => {
      const passEval = evaluateExpiry(emp.passportExpiry);
      const medEval = evaluateExpiry(emp.medicalExpiry);

      if (filterType === 'expired') {
        if (passEval.status !== 'expired' && medEval.status !== 'expired') return false;
      } else if (filterType === 'critical') {
        if (passEval.status !== 'critical' && medEval.status !== 'critical') return false;
      } else if (filterType === 'valid') {
        if (passEval.status !== 'valid' && medEval.status !== 'valid') return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const match =
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.passportNumber.toLowerCase().includes(q) ||
          emp.departmentName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [activeEmployees, filterType, search]);

  const expiredPassCount = activeEmployees.filter((e) => evaluateExpiry(e.passportExpiry).status === 'expired').length;
  const expiredMedCount = activeEmployees.filter((e) => evaluateExpiry(e.medicalExpiry).status === 'expired').length;
  const criticalCount = activeEmployees.filter((e) => {
    const p = evaluateExpiry(e.passportExpiry);
    const m = evaluateExpiry(e.medicalExpiry);
    return (p.status === 'critical' || m.status === 'critical') && p.status !== 'expired' && m.status !== 'expired';
  }).length;

  const handleOpenRenew = (emp: Employee, type: 'passport' | 'medical') => {
    setRenewingEmp(emp);
    setRenewType(type);
    setNewPassportNo(emp.passportNumber);
    setNewDate(type === 'passport' ? emp.passportExpiry || '' : emp.medicalExpiry || '');
  };

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingEmp) return;
    setIsSaving(true);
    try {
      const updates =
        renewType === 'passport'
          ? { passportNumber: newPassportNo, passportExpiry: newDate }
          : { medicalExpiry: newDate };

      await updateEmployee(
        renewingEmp.id,
        updates,
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
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tracked Personnel
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <FileHeart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeEmployees.length}</span>
            <span className="text-xs font-medium text-slate-500">Total active staff</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Mandatory annual seafood handler screening &amp; passport verification
          </p>
        </div>

        <div
          onClick={() => setFilterType('expired')}
          className="cursor-pointer rounded-2xl border border-red-200 bg-white p-5 shadow-xs hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Expired Documents
            </span>
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">
              {expiredPassCount + expiredMedCount}
            </span>
            <span className="text-xs font-medium text-red-600/80">Action required</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {expiredPassCount} Passports • {expiredMedCount} HPA Medicals
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
            <span className="text-xs font-medium text-amber-700">Upcoming renewals</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800 font-medium">
            Schedule hospital appointment &amp; embassy renewal
          </p>
        </div>
      </div>

      {/* Control bar */}
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
            All Personnel ({activeEmployees.length})
          </button>
          <button
            onClick={() => setFilterType('expired')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterType === 'expired'
                ? 'bg-red-600 text-white shadow-xs font-bold'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Expired ({expiredPassCount + expiredMedCount})
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
            Valid
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, passport..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => exportEmployeesToExcel(filteredList, 'KFC_Passport_Medical_Compliance')}
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
                <th className="py-3 px-4">Nationality</th>
                <th className="py-3 px-4">Passport No &amp; Expiry</th>
                <th className="py-3 px-4">Passport Status</th>
                <th className="py-3 px-4">HPA Medical Expiry</th>
                <th className="py-3 px-4">Medical Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No passport or medical records matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => {
                  const passEval = evaluateExpiry(emp.passportExpiry);
                  const medEval = evaluateExpiry(emp.medicalExpiry);

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
                              {emp.employeeId} • {emp.departmentName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {emp.nationality}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900">{emp.passportNumber}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Expires: {formatDate(emp.passportExpiry)}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            passEval.status === 'expired'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : passEval.status === 'critical'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {passEval.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {formatDate(emp.medicalExpiry)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            medEval.status === 'expired'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : medEval.status === 'critical'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {medEval.label}
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRenew(emp, 'medical')}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                          >
                            Update Medical
                          </button>
                          <button
                            onClick={() => handleOpenRenew(emp, 'passport')}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Passport
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

      {/* Renewal Dialog */}
      {renewingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Update {renewType === 'passport' ? 'Passport Information' : 'HPA Medical Fitness'}
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
              {renewType === 'passport' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Passport / ID Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassportNo}
                    onChange={(e) => setNewPassportNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {renewType === 'passport' ? 'New Passport Expiry Date *' : 'New Medical Fitness Expiry Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
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
                  {isSaving ? 'Updating...' : 'Save Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
