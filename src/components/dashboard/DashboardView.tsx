import React from 'react';
import {
  Users,
  AlertTriangle,
  FileCheck2,
  FileClock,
  Building,
  PlaneTakeoff,
  UserPlus,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Calendar,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { Employee, Department, LeaveRecord } from '../../types';
import { evaluateExpiry, formatDate } from '../../utils/dateUtils';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  employees: Employee[];
  departments: Department[];
  leaves: LeaveRecord[];
  onSelectTab: (tab: NavTab) => void;
  onOpenAddEmployee: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  departments,
  leaves,
  onSelectTab,
  onOpenAddEmployee,
  onSelectEmployee,
}) => {
  const activeEmployees = employees.filter((e) => !e.isArchived);
  const totalCount = activeEmployees.length;

  const maldivianCount = activeEmployees.filter((e) => e.nationality.toLowerCase().includes('maldiv')).length;
  const expatCount = totalCount - maldivianCount;

  // Evaluate Compliance
  let expiredWpCount = 0;
  let criticalWpCount = 0;
  let expiredPassCount = 0;
  let criticalPassCount = 0;
  let expiredMedCount = 0;
  let criticalMedCount = 0;
  let criticalContractCount = 0;

  const criticalEmployeesList: {
    emp: Employee;
    docName: string;
    date: string;
    days: number;
    status: 'expired' | 'critical';
  }[] = [];

  activeEmployees.forEach((emp) => {
    // Work Permit
    if (emp.workPermitExpiry) {
      const ev = evaluateExpiry(emp.workPermitExpiry);
      if (ev.status === 'expired') {
        expiredWpCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'Work Permit',
          date: emp.workPermitExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'expired',
        });
      } else if (ev.status === 'critical') {
        criticalWpCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'Work Permit',
          date: emp.workPermitExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'critical',
        });
      }
    }

    // Passport
    if (emp.passportExpiry) {
      const ev = evaluateExpiry(emp.passportExpiry);
      if (ev.status === 'expired') {
        expiredPassCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'Passport',
          date: emp.passportExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'expired',
        });
      } else if (ev.status === 'critical') {
        criticalPassCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'Passport',
          date: emp.passportExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'critical',
        });
      }
    }

    // Medical
    if (emp.medicalExpiry) {
      const ev = evaluateExpiry(emp.medicalExpiry);
      if (ev.status === 'expired') {
        expiredMedCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'HPA Medical Cert',
          date: emp.medicalExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'expired',
        });
      } else if (ev.status === 'critical') {
        criticalMedCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'HPA Medical Cert',
          date: emp.medicalExpiry,
          days: ev.daysRemaining ?? 0,
          status: 'critical',
        });
      }
    }

    // Contract
    if (emp.contractExpiry) {
      const ev = evaluateExpiry(emp.contractExpiry);
      if (ev.status === 'expired' || ev.status === 'critical') {
        criticalContractCount++;
        criticalEmployeesList.push({
          emp,
          docName: 'Contract',
          date: emp.contractExpiry,
          days: ev.daysRemaining ?? 0,
          status: ev.status === 'expired' ? 'expired' : 'critical',
        });
      }
    }
  });

  const totalExpired = expiredWpCount + expiredPassCount + expiredMedCount;
  const totalCritical = criticalWpCount + criticalPassCount + criticalMedCount + criticalContractCount;

  // Compliance percentage
  const complianceRate = totalCount > 0 ? Math.max(0, Math.round(((totalCount - totalExpired) / totalCount) * 100)) : 100;

  // Active Leaves
  const activeLeaves = leaves.filter((l) => l.status === 'approved');

  // Department counts
  const deptCounts = departments.map((d) => {
    const count = activeEmployees.filter(
      (e) => e.departmentId === d.id || e.departmentName.toLowerCase() === d.name.toLowerCase()
    ).length;
    return { name: d.name, code: d.code, count };
  });

  return (
    <div className="space-y-6">
      {/* Sample Data Clear Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 to-sky-50/60 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Kooddoo Fisheries Complex (KFC) — Gaafu Alifu Atoll
              </h3>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                DEMO PREVIEW ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Live monitoring for cold storage operations, canning lines, marine fleet, and expatriate workforce.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAddEmployee}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Widgets - Inspired by Reference UI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Active Employees */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Staff
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-xs font-medium text-slate-500">Active personnel</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Local: <strong className="text-slate-800">{maldivianCount}</strong></span>
            <span>Expatriate: <strong className="text-blue-600">{expatCount}</strong></span>
          </div>
        </div>

        {/* Expired Documents (Urgent Action) */}
        <div
          onClick={() => onSelectTab('work-permit-visa')}
          className="relative cursor-pointer overflow-hidden rounded-2xl border border-red-200 bg-white p-5 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Expired Documents
            </span>
            <div className="rounded-xl bg-red-100 p-2.5 text-red-600 group-hover:scale-110 transition">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{totalExpired}</span>
            <span className="text-xs font-medium text-red-600/80">Immediate attention</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-red-100 pt-3 text-xs text-slate-500">
            <span>WP/Visa: <strong className="text-red-600">{expiredWpCount}</strong></span>
            <span>Passport: <strong className="text-red-600">{expiredPassCount}</strong></span>
            <span>Medical: <strong className="text-red-600">{expiredMedCount}</strong></span>
          </div>
        </div>

        {/* Expiring Soon (<30 Days) */}
        <div
          onClick={() => onSelectTab('work-permit-visa')}
          className="relative cursor-pointer overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Expiring &le; 30 Days
            </span>
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 group-hover:scale-110 transition">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{totalCritical}</span>
            <span className="text-xs font-medium text-amber-700">Renewals in progress</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-3 text-xs text-slate-500">
            <span>Permits: <strong className="text-amber-800">{criticalWpCount}</strong></span>
            <span>Contracts: <strong className="text-amber-800">{criticalContractCount}</strong></span>
          </div>
        </div>

        {/* Staff on Approved Leave */}
        <div
          onClick={() => onSelectTab('attendance')}
          className="relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              On Leave / Travel
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 group-hover:scale-110 transition">
              <PlaneTakeoff className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeLeaves.length}</span>
            <span className="text-xs font-medium text-emerald-600">Approved leaves</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Home leave: <strong>{activeLeaves.filter((l) => l.type === 'home_leave_repatriation').length}</strong></span>
            <span>Medical: <strong>{activeLeaves.filter((l) => l.type === 'medical_leave').length}</strong></span>
          </div>
        </div>
      </div>

      {/* Middle Section: Department Distribution & Compliance Progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Headcount Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Operational Staffing by Department
              </h3>
              <p className="text-xs text-slate-500">
                Staff distribution across processing, cold store, engineering & fleet
              </p>
            </div>
            <button
              onClick={() => onSelectTab('departments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Units <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {deptCounts.map((dept) => {
              const maxCount = Math.max(...deptCounts.map((d) => d.count), 1);
              const percentage = Math.round((dept.count / maxCount) * 100);

              return (
                <div key={dept.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{dept.name}</span>
                    <span className="font-bold text-slate-900">{dept.count} Staff</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Progress Donut / Metric Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-sm">Compliance Status</h3>
              <span className="text-[11px] font-semibold text-slate-400">Real-time</span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Circle */}
                  <path
                    className="text-blue-600"
                    strokeDasharray={`${complianceRate}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900">{complianceRate}%</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Fully Valid Documents</span>
                </div>
                <strong>{totalCount - totalExpired}</strong>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Expired Documents</span>
                </div>
                <strong>{totalExpired}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('work-permit-visa')}
            className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition text-center"
          >
            Review Document Expiry Details
          </button>
        </div>
      </div>

      {/* Expiry Action Priority Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Urgent Document Expiry Action Queue (Expired &amp; &le; 30 Days)
            </h3>
            <p className="text-xs text-slate-500">
              Immediate processing required to avoid Maldives Immigration fines and work permit sanctions
            </p>
          </div>
          <button
            onClick={() => onSelectTab('work-permit-visa')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 self-start sm:self-auto"
          >
            View All Matrices &rarr;
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {criticalEmployeesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No expired or critical document expiries at this time.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Days Left</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalEmployeesList.slice(0, 6).map((item, idx) => (
                  <tr
                    key={idx}
                    onDoubleClick={() => onSelectEmployee(item.emp)}
                    title="Double-click to view staff profile"
                    className="hover:bg-indigo-50/50 transition cursor-pointer select-none"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700 text-xs">
                          {item.emp.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.emp.employeeId} • {item.emp.nationality}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {item.emp.departmentName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{item.docName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono">
                      {item.days < 0 ? (
                        <span className="text-red-600">{Math.abs(item.days)}d ago</span>
                      ) : (
                        <span className="text-amber-700">{item.days}d</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'expired'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status === 'expired' ? 'EXPIRED' : 'EXPIRING SOON'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectEmployee(item.emp)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-blue-600 hover:bg-blue-50 transition"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
