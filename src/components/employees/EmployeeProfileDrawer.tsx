import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Calendar,
  Building,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit2,
  Archive,
  RotateCcw,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  CreditCard,
  HeartPulse,
  Home,
  Briefcase,
  FileCheck,
} from 'lucide-react';
import { Employee } from '../../types';
import { evaluateExpiry, formatDate } from '../../utils/dateUtils';

interface EmployeeProfileDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
  onArchive: (emp: Employee) => void;
  onRestore: (emp: Employee) => void;
}

export const EmployeeProfileDrawer: React.FC<EmployeeProfileDrawerProps> = ({
  employee,
  onClose,
  onEdit,
  onArchive,
  onRestore,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'housing' | 'notes'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!employee) return null;

  const wpEval = evaluateExpiry(employee.workPermitExpiry);
  const visaEval = evaluateExpiry(employee.visaExpiry);
  const passEval = evaluateExpiry(employee.passportExpiry);
  const medEval = evaluateExpiry(employee.medicalExpiry);
  const contractEval = evaluateExpiry(employee.contractExpiry);
  const isMaldivian = employee.nationality.toLowerCase().includes('maldiv');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate service tenure
  const calculateTenure = (joiningDateStr: string) => {
    try {
      const joinDate = new Date(joiningDateStr);
      const now = new Date();
      if (isNaN(joinDate.getTime())) return 'N/A';
      const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      if (years === 0) return `${remMonths} month${remMonths === 1 ? '' : 's'}`;
      if (remMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
      return `${years} yr${years === 1 ? '' : 's'} ${remMonths} mo${remMonths === 1 ? '' : 's'}`;
    } catch {
      return 'N/A';
    }
  };

  const docCards = [
    {
      id: 'wp',
      title: 'Maldives Work Permit',
      number: isMaldivian ? 'EXEMPT (Citizen)' : employee.workPermitNumber || 'None Specified',
      date: employee.workPermitExpiry,
      eval: isMaldivian ? null : wpEval,
      isExempt: isMaldivian,
      desc: 'Ministry of Homeland Security & Technology',
      extra: employee.quotaSlotNumber ? `Quota Slot: ${employee.quotaSlotNumber}` : undefined,
    },
    {
      id: 'visa',
      title: 'Maldives XPAT Visa',
      number: isMaldivian ? 'EXEMPT' : employee.visaNumber || 'Resident Employment Visa',
      date: employee.visaExpiry,
      eval: isMaldivian ? null : visaEval,
      isExempt: isMaldivian,
      desc: 'Maldives Immigration Resident Expatriate Visa',
    },
    {
      id: 'passport',
      title: 'International Passport',
      number: employee.passportNumber,
      date: employee.passportExpiry,
      eval: passEval,
      isExempt: false,
      desc: `Primary National Travel Document (${employee.nationality})`,
    },
    {
      id: 'medical',
      title: 'HPA Medical Fitness Clearance',
      number: employee.medicalFitStatus ? `Status: ${employee.medicalFitStatus.toUpperCase()}` : 'Occupational Fitness',
      date: employee.medicalExpiry,
      eval: medEval,
      isExempt: false,
      desc: 'Health Protection Agency Seafood Processing Clearance',
    },
    {
      id: 'contract',
      title: 'Employment Agreement',
      number: employee.contractType ? employee.contractType.replace('_', ' ').toUpperCase() : 'Tenure Agreement',
      date: employee.contractExpiry,
      eval: contractEval,
      isExempt: false,
      desc: 'KFC Fixed-term / Permanent Employment Contract',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-full max-w-4xl' : 'w-full max-w-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white text-base shadow-sm">
                {employee.fullName.slice(0, 2).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  employee.employmentStatus === 'active'
                    ? 'bg-emerald-500'
                    : employee.employmentStatus === 'on_leave'
                    ? 'bg-sky-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${employee.employmentStatus}`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                  {employee.fullName}
                </h3>
                {employee.shortName && (
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    "{employee.shortName}"
                  </span>
                )}
                {employee.isSampleData && (
                  <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    SAMPLE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-800">{employee.employeeId}</span>
                <span>•</span>
                <span className="text-slate-600 font-sans">{employee.jobTitle}</span>
                <span>•</span>
                <span className="text-indigo-600 font-sans font-medium">{employee.departmentName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title={isExpanded ? 'Collapse width' : 'Expand full width'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onEdit(employee)}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-2xs"
            >
              <Edit2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 text-xs font-semibold text-slate-500 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Compliance &amp; Expiry</span>
            {(wpEval.status === 'expired' || passEval.status === 'expired' || medEval.status === 'expired') && (
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('housing')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'housing'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Quarters &amp; Logistics</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>HR Notes</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Staff Status
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold capitalize ${
                      employee.employmentStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : employee.employmentStatus === 'on_leave'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {employee.employmentStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nationality
                  </span>
                  <span className="mt-1 font-bold text-slate-900 text-xs block">
                    {employee.nationality} {isMaldivian ? '(Local)' : '(Expatriate)'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Date of Joining
                  </span>
                  <span className="mt-1 font-bold font-mono text-slate-900 text-xs block">
                    {formatDate(employee.joiningDate)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Service Tenure
                  </span>
                  <span className="mt-1 font-bold text-indigo-700 text-xs block">
                    {calculateTenure(employee.joiningDate)}
                  </span>
                </div>
              </div>

              {/* Personal & Identification Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-indigo-600" />
                    <span>Identification &amp; Personal Particulars</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Full Legal Name</span>
                    <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{employee.fullName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Short / Call Name</span>
                    <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                      {employee.shortName || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">KFC Employee ID</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-sm">{employee.employeeId}</span>
                      <button
                        onClick={() => copyToClipboard(employee.employeeId, 'empId')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                        title="Copy Employee ID"
                      >
                        {copiedField === 'empId' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Passport Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-sm">{employee.passportNumber}</span>
                      <button
                        onClick={() => copyToClipboard(employee.passportNumber, 'pass')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                        title="Copy Passport Number"
                      >
                        {copiedField === 'pass' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {employee.nationalIdOrIqama && (
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">Maldives National ID / Iqama</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {employee.nationalIdOrIqama}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Department</span>
                    <span className="font-semibold text-indigo-700 text-sm mt-0.5 block">
                      {employee.departmentName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Designation / Job Title</span>
                    <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{employee.jobTitle}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Contract Type</span>
                    <span className="font-semibold text-slate-800 text-sm mt-0.5 block capitalize">
                      {employee.contractType ? employee.contractType.replace('_', ' ') : 'Fixed-term Agreement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Particulars */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-indigo-600" />
                  <span>Communication &amp; Emergency Contact</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">Primary Contact Phone</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                        {employee.phone || 'No phone recorded'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">Official Email Address</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                        {employee.email || 'None on file'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">Emergency Next of Kin Contact</span>
                      <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                        {employee.emergencyContact || 'No emergency contact registered'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLIANCE & EXPIRY */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Maldives Regulatory Compliance Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ministry of Homeland Security, XPAT Visas, Passports and HPA Seafood certifications
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {docCards.map((doc) => {
                  const evalData = doc.eval;
                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                            {doc.isExempt ? (
                              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Exempt (Citizen)
                              </span>
                            ) : evalData ? (
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  evalData.status === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : evalData.status === 'critical'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {evalData.label}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 font-mono">
                            {doc.number} {doc.extra ? `• ${doc.extra}` : ''}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{doc.desc}</p>
                        </div>

                        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                            Expiry Date
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                            {doc.isExempt ? 'Permanent' : formatDate(doc.date)}
                          </span>
                          {!doc.isExempt && evalData && evalData.daysRemaining !== null && (
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                              {evalData.daysRemaining < 0
                                ? `${Math.abs(evalData.daysRemaining)} days overdue`
                                : `${evalData.daysRemaining} days remaining`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUARTERS & HOUSING */}
          {activeTab === 'housing' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <span>Kooddoo Island Quarters &amp; Camp Allocation</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Island Unit / Camp Location</span>
                    <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                      {employee.islandOrCamp || 'Staff Quarters Block A (General)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Complex Station</span>
                    <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                      Kooddoo Fisheries Complex (GA. Kooddoo)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Facility Category</span>
                    <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                      {isMaldivian ? 'Local Staff Accommodation' : 'Expatriate Labor Camp & Quarters'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Logistics &amp; Transport</span>
                    <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                      Direct Island Pier &amp; Airport Access (Kooddoo GKK)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HR NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>HR Officer Administrative Notes</span>
                </h4>
                {employee.notes ? (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200">
                    {employee.notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No special HR remarks or administrative notes registered for this employee.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Record Created:</span>
                  <span className="font-mono">{formatDate(employee.createdAt || employee.joiningDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Record Status:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {employee.isArchived ? 'Archived (InActive)' : 'Active Employment'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
          <div>
            {employee.isArchived || employee.employmentStatus === 'archived' ? (
              <button
                onClick={() => {
                  onRestore(employee);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore to Active</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onArchive(employee);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                <Archive className="h-4 w-4" />
                <span>Archive Employee</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(employee);
                onClose();
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              Edit Staff Record
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
