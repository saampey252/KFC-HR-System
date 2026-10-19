import React, { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, Building, ShieldCheck, MapPin, Phone, AlertCircle } from 'lucide-react';
import { Employee, Department } from '../../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Omit<Employee, 'id'>) => Promise<void>;
  editingEmployee?: Employee | null;
  departments: Department[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEmployee,
  departments,
}) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    employeeId: '',
    fullName: '',
    passportNumber: '',
    nationality: 'Maldivian',
    departmentId: departments[0]?.id || 'dept-proc',
    departmentName: departments[0]?.name || 'Fish Processing & Canning',
    jobTitle: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentStatus: 'active',
    workPermitNumber: '',
    workPermitExpiry: '',
    visaExpiry: '',
    passportExpiry: '',
    medicalExpiry: '',
    contractExpiry: '',
    gender: 'Male',
    email: '',
    phone: '',
    islandOrCamp: '',
    emergencyContact: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        employeeId: editingEmployee.employeeId,
        fullName: editingEmployee.fullName,
        passportNumber: editingEmployee.passportNumber || '',
        nationality: editingEmployee.nationality,
        departmentId: editingEmployee.departmentId,
        departmentName: editingEmployee.departmentName,
        jobTitle: editingEmployee.jobTitle,
        joiningDate: editingEmployee.joiningDate,
        employmentStatus: editingEmployee.employmentStatus,
        workPermitNumber: editingEmployee.workPermitNumber || '',
        workPermitExpiry: editingEmployee.workPermitExpiry || '',
        visaExpiry: editingEmployee.visaExpiry || '',
        passportExpiry: editingEmployee.passportExpiry || '',
        medicalExpiry: editingEmployee.medicalExpiry || '',
        contractExpiry: editingEmployee.contractExpiry || '',
        gender: editingEmployee.gender || 'Male',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        islandOrCamp: editingEmployee.islandOrCamp || '',
        emergencyContact: editingEmployee.emergencyContact || '',
        notes: editingEmployee.notes || '',
        createdAt: editingEmployee.createdAt,
        updatedAt: editingEmployee.updatedAt,
      });
    } else {
      // Auto generate KFC ID
      const randomId = `KFC-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        employeeId: randomId,
        fullName: '',
        passportNumber: '',
        nationality: 'Maldivian',
        departmentId: departments[0]?.id || 'dept-proc',
        departmentName: departments[0]?.name || 'Fish Processing & Canning',
        jobTitle: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        employmentStatus: 'active',
        workPermitNumber: '',
        workPermitExpiry: '',
        visaExpiry: '',
        passportExpiry: '',
        medicalExpiry: '',
        contractExpiry: '',
        gender: 'Male',
        email: '',
        phone: '',
        islandOrCamp: 'Kooddoo Island Staff Quarters',
        emergencyContact: '',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setError(null);
  }, [editingEmployee, isOpen, departments]);

  if (!isOpen) return null;

  const handleDepartmentChange = (deptId: string) => {
    const selected = departments.find((d) => d.id === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentName: selected ? selected.name : prev.departmentName,
    }));
  };

  const isMaldivian = formData.nationality.toLowerCase().includes('maldiv');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required.');
      return;
    }
    if (!formData.jobTitle.trim()) {
      setError('Job Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save employee record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingEmployee ? 'Edit Employee Record' : 'Register New Employee'}
              </h3>
              <p className="text-xs text-slate-500">
                Kooddoo Fisheries Complex Personnel Information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Core Profile */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> 1. Employment &amp; Identity
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g. KFC-0145"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full legal name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nationality *
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="Maldivian">Maldivian</option>
                  <option value="Bangladeshi">Bangladeshi</option>
                  <option value="Indian">Indian</option>
                  <option value="Sri Lankan">Sri Lankan</option>
                  <option value="Filipino">Filipino</option>
                  <option value="Nepalese">Nepalese</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passport / National ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                  placeholder="e.g. A381920 or EE81920"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title / Position *
                </label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Blast Freezer Tech"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Status
                </label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employmentStatus: e.target.value as Employee['employmentStatus'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="active">Active Staff</option>
                  <option value="on_leave">On Authorized Leave</option>
                  <option value="probation">Probationary Period</option>
                  <option value="archived">Archived / Tenured</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accommodation Quarters / Dormitory
                </label>
                <input
                  type="text"
                  value={formData.islandOrCamp}
                  onChange={(e) => setFormData({ ...formData, islandOrCamp: e.target.value })}
                  placeholder="e.g. Kooddoo Expat Dorm A, Room 14"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Expiry & Document Tracking */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" /> 2. Maldives Compliance &amp; Expiry Dates
              </h4>
              {isMaldivian && (
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Maldivian National: WP &amp; Visa exempt
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Permit Number {isMaldivian ? '(Exempt)' : ''}
                </label>
                <input
                  type="text"
                  disabled={isMaldivian}
                  value={formData.workPermitNumber}
                  onChange={(e) => setFormData({ ...formData, workPermitNumber: e.target.value })}
                  placeholder={isMaldivian ? 'EXEMPT (Maldivian National)' : 'e.g. WP-MV-2024-08129'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-900 disabled:opacity-50 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Permit Expiry Date {isMaldivian ? '(N/A)' : ''}
                </label>
                <input
                  type="date"
                  disabled={isMaldivian}
                  value={formData.workPermitExpiry}
                  onChange={(e) => setFormData({ ...formData, workPermitExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maldives XPAT Visa Expiry Date {isMaldivian ? '(N/A)' : ''}
                </label>
                <input
                  type="date"
                  disabled={isMaldivian}
                  value={formData.visaExpiry}
                  onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passport Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.passportExpiry}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HPA Medical Fitness Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.medicalExpiry}
                  onChange={(e) => setFormData({ ...formData, medicalExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Contract Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.contractExpiry}
                  onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Remarks */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> 3. Contact &amp; Emergency Information
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+960 7XX-XXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@kfc.mv"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact (Next of Kin)
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Name, relationship, and international or local phone"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HR Compliance Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special certifications, passport renewal notes, quarantine records, etc."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Record' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
