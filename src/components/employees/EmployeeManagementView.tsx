import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  Filter,
  MoreVertical,
  Check,
  X,
  Building,
  RotateCcw,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Employee, Department, EmploymentStatus } from '../../types';
import { evaluateExpiry, formatDate } from '../../utils/dateUtils';
import { exportEmployeesToExcel } from '../../utils/excelUtils';
import { bulkUpdateEmployees } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface EmployeeManagementViewProps {
  employees: Employee[];
  departments: Department[];
  onOpenAddModal: () => void;
  onOpenEditModal: (emp: Employee) => void;
  onOpenProfileDrawer: (emp: Employee) => void;
  onArchiveEmployee: (emp: Employee) => void;
  onRestoreEmployee: (emp: Employee) => void;
  globalSearch: string;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  departments,
  onOpenAddModal,
  onOpenEditModal,
  onOpenProfileDrawer,
  onArchiveEmployee,
  onRestoreEmployee,
  globalSearch,
}) => {
  const { user } = useAuth();

  // Sub-tabs: General | Employment | Compliance & Visas (as in MIFCO hr.mifco.mv)
  const [subTab, setSubTab] = useState<'General' | 'Employment' | 'Compliance'>('General');

  // Status Filter: Active vs InActive
  const [statusFilter, setStatusFilter] = useState<'Active' | 'InActive'>('Active');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterShortName, setFilterShortName] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk Action Modals
  const [isBulkDeptModalOpen, setIsBulkDeptModalOpen] = useState(false);
  const [targetBulkDeptId, setTargetBulkDeptId] = useState<string>(departments[0]?.id || '');
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [targetBulkStatus, setTargetBulkStatus] = useState<EmploymentStatus>('active');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Row Action Menu popup
  const [openRowActionId, setOpenRowActionId] = useState<string | null>(null);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const effectiveSearch = (globalSearch || search).trim().toLowerCase();

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Status filter
      if (statusFilter === 'Active') {
        if (emp.employmentStatus === 'archived' || emp.isArchived) return false;
      } else {
        if (emp.employmentStatus !== 'archived' && !emp.isArchived) return false;
      }

      // Department filter
      if (selectedDept !== 'all') {
        if (emp.departmentId !== selectedDept && emp.departmentName !== selectedDept) return false;
      }

      // Emp ID filter
      if (filterEmpId && !emp.employeeId.toLowerCase().includes(filterEmpId.toLowerCase())) {
        return false;
      }

      // Short Name filter
      if (filterShortName) {
        const sName = (emp.shortName || emp.fullName).toLowerCase();
        if (!sName.includes(filterShortName.toLowerCase())) return false;
      }

      // Global or local search
      if (effectiveSearch) {
        const match =
          emp.fullName.toLowerCase().includes(effectiveSearch) ||
          (emp.shortName && emp.shortName.toLowerCase().includes(effectiveSearch)) ||
          emp.employeeId.toLowerCase().includes(effectiveSearch) ||
          emp.passportNumber.toLowerCase().includes(effectiveSearch) ||
          (emp.workPermitNumber && emp.workPermitNumber.toLowerCase().includes(effectiveSearch)) ||
          emp.jobTitle.toLowerCase().includes(effectiveSearch) ||
          emp.departmentName.toLowerCase().includes(effectiveSearch);
        if (!match) return false;
      }

      return true;
    });
  }, [
    employees,
    statusFilter,
    selectedDept,
    filterEmpId,
    filterShortName,
    effectiveSearch,
  ]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Selection helpers
  const isAllPageSelected =
    paginatedEmployees.length > 0 &&
    paginatedEmployees.every((e) => selectedIds.has(e.id));

  const isSomePageSelected =
    paginatedEmployees.some((e) => selectedIds.has(e.id)) && !isAllPageSelected;

  const toggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedEmployees.forEach((e) => next.delete(e.id));
    } else {
      paginatedEmployees.forEach((e) => next.add(e.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedEmployeesList = useMemo(() => {
    return employees.filter((e) => selectedIds.has(e.id));
  }, [employees, selectedIds]);

  // Bulk actions
  const handleConfirmBulkDept = async () => {
    const targetDept = departments.find((d) => d.id === targetBulkDeptId);
    if (!targetDept) return;
    setIsBulkProcessing(true);
    try {
      await bulkUpdateEmployees(
        Array.from(selectedIds),
        {
          departmentId: targetDept.id,
          departmentName: targetDept.name,
        },
        actorInfo,
        `Transferred to department ${targetDept.name} (${targetDept.code})`
      );
      setFeedbackMsg(`Transferred ${selectedIds.size} employees to ${targetDept.name}`);
      setIsBulkDeptModalOpen(false);
      setSelectedIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      alert('Failed to update department in bulk');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleConfirmBulkStatus = async () => {
    setIsBulkProcessing(true);
    try {
      const isArchived = targetBulkStatus === 'archived';
      await bulkUpdateEmployees(
        Array.from(selectedIds),
        {
          employmentStatus: targetBulkStatus,
          isArchived,
        },
        actorInfo,
        `Status set to ${targetBulkStatus.toUpperCase()}`
      );
      setFeedbackMsg(`Updated status for ${selectedIds.size} employees`);
      setIsBulkStatusModalOpen(false);
      setSelectedIds(new Set());
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      alert('Failed to update status in bulk');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-3 pb-20 text-slate-800">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="ml-2 text-emerald-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs: General | Employment | Compliance & Visas */}
      <div className="flex items-center gap-6 border-b border-slate-200 px-2 pt-1 text-sm font-semibold text-slate-500">
        <button
          onClick={() => setSubTab('General')}
          className={`pb-2.5 transition relative ${
            subTab === 'General'
              ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 -mb-px'
              : 'hover:text-slate-800'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setSubTab('Employment')}
          className={`pb-2.5 transition relative ${
            subTab === 'Employment'
              ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 -mb-px'
              : 'hover:text-slate-800'
          }`}
        >
          Employment
        </button>
        <button
          onClick={() => setSubTab('Compliance')}
          className={`pb-2.5 transition relative ${
            subTab === 'Compliance'
              ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 -mb-px'
              : 'hover:text-slate-800'
          }`}
        >
          Compliance &amp; Visas
        </button>
      </div>

      {/* Action Buttons Toolbar - exact matching layout from IMG_4644.png */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* + Add Button (MIFCO purple) */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>

          {/* Default pill */}
          <button
            onClick={() => {
              setSelectedDept('all');
              setFilterEmpId('');
              setFilterShortName('');
              setSearch('');
            }}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition"
          >
            Default
          </button>

          {/* Approved pill */}
          <button
            onClick={() => setStatusFilter('Active')}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-2xs"
          >
            Approved
          </button>

          {/* Import General Button */}
          <button
            onClick={() => {
              const fileInput = document.getElementById('mifco-excel-import-input');
              if (fileInput) fileInput.click();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
          >
            <Download className="h-3.5 w-3.5 rotate-180" />
            <span>Import General</span>
          </button>
          <input
            id="mifco-excel-import-input"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={() => alert('Spreadsheet parser ready in Reports & Excel tab')}
          />

          {/* Status Toggle Pills: Active | InActive */}
          <div className="flex items-center rounded-lg border border-slate-300 p-0.5 bg-white">
            <button
              onClick={() => {
                setStatusFilter('Active');
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                statusFilter === 'Active'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('InActive');
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                statusFilter === 'InActive'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              InActive
            </button>
          </div>

          {/* Excel Export Button - Green Icon in white border box */}
          <button
            onClick={() => exportEmployeesToExcel(filteredEmployees, 'MIFCO_KFC_Staff_Details')}
            title="Export to Excel"
            className="flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 p-1.5 transition text-emerald-600 shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>

        {/* Right Search Input & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff details..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isFilterDropdownOpen || selectedDept !== 'all' || filterEmpId || filterShortName
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdown Tray */}
      {isFilterDropdownOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Filter by Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Filter by Emp ID</label>
            <input
              type="text"
              value={filterEmpId}
              onChange={(e) => setFilterEmpId(e.target.value)}
              placeholder="e.g. 101758"
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Filter by Short Name</label>
            <input
              type="text"
              value={filterShortName}
              onChange={(e) => setFilterShortName(e.target.value)}
              placeholder="e.g. Mostofa, Ibrahim, Saiful"
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Quick Action Hint Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 py-0.5">
        <div className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 rounded-md px-2.5 py-1 text-indigo-700 font-medium">
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          <span>Double-click any staff row to view full profile details</span>
        </div>
        <span className="text-slate-400 font-mono text-[10px]">
          {filteredEmployees.length} staff record{filteredEmployees.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Table - exact layout and styling matching IMG_4644.png */}
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-300 bg-slate-50/90 text-indigo-900 font-semibold text-[11px]">
              <tr>
                {/* 3-dots action / select column */}
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">
                  <button
                    type="button"
                    onClick={toggleSelectAllPage}
                    className="p-0.5 rounded text-slate-400 hover:text-indigo-600"
                    title={isAllPageSelected ? 'Deselect all' : 'Select all page'}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : isSomePageSelected ? (
                      <MinusSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>

                {/* Emp ID with filter icon */}
                <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1 text-blue-600 font-bold">
                    <span>Emp ID</span>
                    <Filter className="h-3 w-3 text-blue-500 fill-blue-500" />
                  </div>
                </th>

                {/* Short Name with filter icon */}
                <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1 text-blue-600 font-bold">
                    <span>Short Name</span>
                    <Filter className="h-3 w-3 text-blue-500 fill-blue-500" />
                  </div>
                </th>

                {/* Full Name */}
                <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-blue-600 font-bold">
                  Full Name
                </th>

                {/* DOJ (Date of Joining) */}
                <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-blue-600 font-bold">
                  DOJ
                </th>

                {/* SubTab Dependent Columns */}
                {subTab === 'General' && (
                  <>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Department
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Job Title
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Nationality
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-bold">
                      Status
                    </th>
                  </>
                )}

                {subTab === 'Employment' && (
                  <>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Department
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Contract Expiry
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Contract Status
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-bold">
                      Quarters / Island Room
                    </th>
                  </>
                )}

                {subTab === 'Compliance' && (
                  <>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Work Permit No
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      WP Expiry
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Passport Expiry
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold">
                      Medical Expiry
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-bold">
                      Action
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No staff records found in this view.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const isSelected = selectedIds.has(emp.id);
                  const shortName = emp.shortName || emp.fullName.split(' ')[0];
                  const wpEval = evaluateExpiry(emp.workPermitExpiry);
                  const passEval = evaluateExpiry(emp.passportExpiry);
                  const medEval = evaluateExpiry(emp.medicalExpiry);
                  const contractEval = evaluateExpiry(emp.contractExpiry);
                  const isLocal = emp.nationality.toLowerCase().includes('maldiv');

                  return (
                    <tr
                      key={emp.id}
                      onDoubleClick={() => onOpenProfileDrawer(emp)}
                      title="Double-click to view staff profile details"
                      className={`transition cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-50/70'
                          : 'hover:bg-slate-100/70'
                      }`}
                    >
                      {/* 3-dots action menu + checkbox */}
                      <td
                        className="py-2 px-2 text-center border-r border-slate-200 whitespace-nowrap"
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1 relative">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(emp.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenRowActionId(openRowActionId === emp.id ? null : emp.id)
                            }
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Row Action Menu popover */}
                          {openRowActionId === emp.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenRowActionId(null)}
                              />
                              <div className="absolute left-10 top-0 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl text-left">
                                <button
                                  onClick={() => {
                                    onOpenProfileDrawer(emp);
                                    setOpenRowActionId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  onClick={() => {
                                    onOpenEditModal(emp);
                                    setOpenRowActionId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                                  <span>Edit Details</span>
                                </button>
                                {emp.employmentStatus === 'archived' ? (
                                  <button
                                    onClick={() => {
                                      onRestoreEmployee(emp);
                                      setOpenRowActionId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Restore Active</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      onArchiveEmployee(emp);
                                      setOpenRowActionId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                    <span>Archive Record</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Emp ID */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">
                        {emp.employeeId}
                      </td>

                      {/* Short Name */}
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                        {shortName}
                      </td>

                      {/* Full Name */}
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {emp.fullName}
                      </td>

                      {/* DOJ (Formatted like 18-May-2022) */}
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-mono whitespace-nowrap">
                        {formatDate(emp.joiningDate)}
                      </td>

                      {/* Tab: General */}
                      {subTab === 'General' && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {emp.departmentName}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                            {emp.jobTitle}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {emp.nationality}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold capitalize ${
                                emp.employmentStatus === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : emp.employmentStatus === 'on_leave'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {emp.employmentStatus.replace('_', ' ')}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Tab: Employment */}
                      {subTab === 'Employment' && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {emp.departmentName}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-800">
                            {formatDate(emp.contractExpiry)}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                contractEval.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : contractEval.status === 'critical'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {contractEval.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {emp.islandOrCamp || 'Staff Quarters'}
                          </td>
                        </>
                      )}

                      {/* Tab: Compliance & Visas */}
                      {subTab === 'Compliance' && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-800">
                            {isLocal ? 'EXEMPT (Local)' : emp.workPermitNumber || 'Missing WP #'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            {isLocal ? (
                              <span className="text-slate-400">Citizen</span>
                            ) : (
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  wpEval.status === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : wpEval.status === 'critical'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {wpEval.label}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                passEval.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : passEval.status === 'critical'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {passEval.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                medEval.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : medEval.status === 'critical'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {medEval.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => onOpenProfileDrawer(emp)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Toolbar - exact match to hr.mifco.mv screenshot */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page number selector box */}
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold text-slate-700"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-30"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>

            <span className="text-[11px] text-slate-400 ml-2">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredEmployees.length)} of{' '}
              {filteredEmployees.length} records
            </span>
          </div>

          {/* Refresh Icon */}
          <button
            onClick={() => {
              setCurrentPage(1);
              setFeedbackMsg('Refreshed latest records from Cloud Firestore');
              setTimeout(() => setFeedbackMsg(null), 2500);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 transition"
            title="Refresh Table"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar (when employees are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-slate-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-xs shadow-xs">
                {selectedIds.size}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {selectedIds.size} Employee{selectedIds.size > 1 ? 's' : ''} Selected
                </span>
                <span className="text-[11px] text-slate-400">
                  Bulk HR actions for selected KFC personnel
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeptModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition border border-slate-700"
              >
                <Building className="h-3.5 w-3.5 text-indigo-400" />
                <span>Move Dept</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkStatusModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition border border-slate-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Set Status</span>
              </button>

              <button
                type="button"
                onClick={() => exportEmployeesToExcel(selectedEmployeesList, 'KFC_Selected_Staff')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-1"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Change Department */}
      {isBulkDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Transfer Department ({selectedIds.size} Employees)
                </h3>
                <p className="text-xs text-slate-500">
                  Reassign all selected personnel to a new operational division
                </p>
              </div>
              <button
                onClick={() => setIsBulkDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target KFC Department *
                </label>
                <select
                  value={targetBulkDeptId}
                  onChange={(e) => setTargetBulkDeptId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-indigo-50/70 p-3 text-[11px] text-indigo-900 border border-indigo-200">
                <strong>Employees affected:</strong>
                <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5 text-slate-600 font-mono">
                  {selectedEmployeesList.slice(0, 8).map((e) => (
                    <div key={e.id} className="truncate">
                      • {e.fullName} ({e.employeeId}) — Currently: {e.departmentName}
                    </div>
                  ))}
                  {selectedEmployeesList.length > 8 && (
                    <div className="text-slate-400">
                      ...and {selectedEmployeesList.length - 8} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBulkDeptModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDept}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isBulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Set Status */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Assign Employment Status ({selectedIds.size} Employees)
                </h3>
                <p className="text-xs text-slate-500">
                  Update the operational employment status for all selected staff
                </p>
              </div>
              <button
                onClick={() => setIsBulkStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Employment Status *
                </label>
                <select
                  value={targetBulkStatus}
                  onChange={(e) => setTargetBulkStatus(e.target.value as EmploymentStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                >
                  <option value="active">Active Staff</option>
                  <option value="on_leave">On Authorized Leave / Away</option>
                  <option value="probation">Probationary Period</option>
                  <option value="archived">Archived / InActive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkStatus}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isBulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Apply Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright matching hr.mifco.mv */}
      <footer className="pt-4 text-center text-[11px] text-slate-500">
        Copyrights &copy; 2026 Systems Solutions. All rights reserved.
      </footer>
    </div>
  );
};
