import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { Department, JobPosition, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  saveDepartment,
  deleteDepartment,
  saveJobPosition,
  deleteJobPosition,
} from '../../services/firestoreService';

interface DepartmentsViewProps {
  departments: Department[];
  jobPositions: JobPosition[];
  employees: Employee[];
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  jobPositions,
  employees,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'positions'>('departments');

  // Department modal state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    headOfDepartment: '',
    description: '',
  });

  // Position modal state
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posForm, setPosForm] = useState<{
    title: string;
    departmentId: string;
    level: JobPosition['level'];
    description: string;
  }>({
    title: '',
    departmentId: departments[0]?.id || '',
    level: 'Operations & Plant',
    description: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      code: '',
      headOfDepartment: '',
      description: '',
    });
    setIsDeptModalOpen(true);
    setError(null);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment,
      description: dept.description,
    });
    setIsDeptModalOpen(true);
    setError(null);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      setError('Department Name and Code are required.');
      return;
    }
    setIsSaving(true);
    try {
      await saveDepartment(
        {
          id: editingDept?.id,
          name: deptForm.name,
          code: deptForm.code,
          headOfDepartment: deptForm.headOfDepartment,
          description: deptForm.description,
        },
        actorInfo
      );
      setIsDeptModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove department: ${name}?`)) {
      try {
        await deleteDepartment(id, actorInfo);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete');
      }
    }
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.title) {
      setError('Position Title is required.');
      return;
    }
    setIsSaving(true);
    try {
      const selectedDept = departments.find((d) => d.id === posForm.departmentId);
      await saveJobPosition(
        {
          title: posForm.title,
          departmentId: posForm.departmentId,
          departmentName: selectedDept?.name,
          level: posForm.level,
          description: posForm.description,
        },
        actorInfo
      );
      setIsPosModalOpen(false);
      setPosForm({
        title: '',
        departmentId: departments[0]?.id || '',
        level: 'Operations & Plant',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save position');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePos = async (id: string) => {
    if (confirm('Delete this job position?')) {
      try {
        await deleteJobPosition(id, actorInfo);
      } catch (err) {
        alert('Failed to delete position');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Organizational Structure &amp; Hierarchy
          </h2>
          <p className="text-xs text-slate-500">
            Kooddoo Fisheries Complex operational divisions, plants, and job designations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('departments')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'departments'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departments ({departments.length})
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'positions'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Job Positions ({jobPositions.length})
            </button>
          </div>

          {activeTab === 'departments' ? (
            <button
              onClick={handleOpenAddDept}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Department</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsPosModalOpen(true);
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Position</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'departments' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const activeStaffCount = employees.filter(
              (e) =>
                !e.isArchived &&
                (e.departmentId === dept.id || e.departmentName.toLowerCase() === dept.name.toLowerCase())
            ).length;

            return (
              <div
                key={dept.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700 text-sm">
                        {dept.code}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Head: {dept.headOfDepartment}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditDept(dept)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(dept.id, dept.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {dept.description || 'Primary operational unit at KFC complex.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Active Staff:</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {activeStaffCount} personnel
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Job Positions List */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Designation / Title</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Seniority Level</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobPositions.map((pos) => {
                  const dept = departments.find((d) => d.id === pos.departmentId);
                  return (
                    <tr key={pos.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {pos.title}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {dept?.name || pos.departmentName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {pos.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {pos.description || 'Operational position at KFC'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeletePos(pos.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="mt-4 space-y-4 text-xs">
              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-red-700 text-xs">{error}</div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Fish Processing & Canning"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Code (2-5 letters) *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PROC, COLD, QA, FLEET"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Head of Department
                </label>
                <input
                  type="text"
                  value={deptForm.headOfDepartment}
                  onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                  placeholder="e.g. Mohamed Shifaz"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Primary role and scope of this operational department"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Job Designation</h3>
              <button
                onClick={() => setIsPosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePosition} className="mt-4 space-y-4 text-xs">
              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-red-700 text-xs">{error}</div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={posForm.title}
                  onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                  placeholder="e.g. Cold Storage Ammonia Operator"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={posForm.departmentId}
                  onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Role Hierarchy Level
                </label>
                <select
                  value={posForm.level}
                  onChange={(e) =>
                    setPosForm({
                      ...posForm,
                      level: e.target.value as JobPosition['level'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="Executive">Executive / Management</option>
                  <option value="Supervisory">Supervisory / Shift Lead</option>
                  <option value="Skilled Technical">Skilled Technical</option>
                  <option value="Operations & Plant">Operations &amp; Plant</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Description / Scope
                </label>
                <textarea
                  rows={2}
                  value={posForm.description}
                  onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  placeholder="Brief description of primary duties"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
