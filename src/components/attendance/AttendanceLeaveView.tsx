import React, { useState } from 'react';
import {
  CalendarCheck2,
  Plus,
  PlaneTakeoff,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { LeaveRecord, Employee, LeaveType } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { addLeaveRecord, updateLeaveStatus } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface AttendanceLeaveViewProps {
  leaves: LeaveRecord[];
  employees: Employee[];
}

export const AttendanceLeaveView: React.FC<AttendanceLeaveViewProps> = ({
  leaves,
  employees,
}) => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formEmpId, setFormEmpId] = useState(employees[0]?.employeeId || '');
  const [formType, setFormType] = useState<LeaveType>('annual_leave');
  const [formStart, setFormStart] = useState(new Date().toISOString().slice(0, 10));
  const [formEnd, setFormEnd] = useState(new Date().toISOString().slice(0, 10));
  const [formDays, setFormDays] = useState(7);
  const [formReason, setFormReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const filteredLeaves = leaves.filter((l) => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEmp = employees.find((e) => e.employeeId === formEmpId);
    if (!selectedEmp) return;

    setIsSubmitting(true);
    try {
      await addLeaveRecord(
        {
          employeeId: selectedEmp.employeeId,
          employeeName: selectedEmp.fullName,
          departmentName: selectedEmp.departmentName,
          type: formType,
          startDate: formStart,
          endDate: formEnd,
          days: Number(formDays) || 1,
          status: 'pending',
          reason: formReason,
          approvedBy: '',
          createdAt: new Date().toISOString(),
        },
        actorInfo
      );
      setIsModalOpen(false);
      setFormReason('');
    } catch (err) {
      alert('Failed to submit leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateLeaveStatus(id, 'approved', actorInfo.name, actorInfo);
    } catch {
      alert('Failed to update leave');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateLeaveStatus(id, 'rejected', actorInfo.name, actorInfo);
    } catch {
      alert('Failed to update leave');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Staff on Active Leave
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <PlaneTakeoff className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{approvedCount}</span>
            <span className="text-xs font-medium text-slate-500">Authorized away</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Including expatriate home leaves and annual island vacations
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{pendingCount}</span>
            <span className="text-xs font-medium text-amber-700">Awaiting HR decision</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800 font-medium">
            Requires HR clearance &amp; department head sign-off
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Attendance Protocols</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Expatriate staff departing Kooddoo Island for home leave require exit permit and ticket verification.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Apply / Record Leave</span>
          </button>
        </div>
      </div>

      {/* Filter and Leave Records Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({leaves.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            KFC Shift Roster &amp; Travel Registry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration &amp; Period</th>
                <th className="py-3 px-4">Reason / Travel Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No leave records found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{l.employeeName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {l.employeeId} • {l.departmentName}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 capitalize">
                        {l.type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 font-mono">{l.days} Days</p>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(l.startDate)} &rarr; {formatDate(l.endDate)}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {l.reason || 'General leave'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${
                          l.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : l.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {l.status}
                      </span>
                      {l.approvedBy && (
                        <p className="text-[10px] text-slate-400 mt-0.5">By {l.approvedBy}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(l.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white font-semibold hover:bg-emerald-700 text-xs shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(l.id)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-slate-600 hover:bg-red-50 hover:text-red-600 text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Record Employee Leave</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Employee *
                </label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {employees
                    .filter((e) => !e.isArchived)
                    .map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId}) - {emp.departmentName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Leave Category *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as LeaveType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="annual_leave">Annual Leave (Local / Island)</option>
                  <option value="home_leave_repatriation">Expatriate Home Leave (International)</option>
                  <option value="medical_leave">Medical Sick Leave</option>
                  <option value="emergency_leave">Emergency Family Leave</option>
                  <option value="compassionate_leave">Compassionate Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Working / Calendar Days
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formDays}
                  onChange={(e) => setFormDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason / Flight &amp; Destination Details
                </label>
                <textarea
                  rows={2}
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Return flight to Dhaka on 20th Oct, ticket confirmed"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
