import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';
import { HrDocument, DocumentCategory, Employee } from '../../types';
import { formatDate, evaluateExpiry } from '../../utils/dateUtils';
import { addHrDocument, deleteHrDocument } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface HrDocumentsViewProps {
  documents: HrDocument[];
  employees: Employee[];
}

export const HrDocumentsView: React.FC<HrDocumentsViewProps> = ({
  documents,
  employees,
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('Work Permit');
  const [formEmpId, setFormEmpId] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const categories: DocumentCategory[] = [
    'Work Permit',
    'Visa Copy',
    'Passport Copy',
    'Medical Fitness Clearance',
    'Employment Contract',
    'KFC Safety & Health Cert',
    'Company Policy',
  ];

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        doc.title.toLowerCase().includes(q) ||
        (doc.employeeName && doc.employeeName.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    const emp = employees.find((e) => e.employeeId === formEmpId);

    setIsSubmitting(true);
    try {
      await addHrDocument(
        {
          title: formTitle,
          category: formCategory,
          employeeId: emp?.employeeId,
          employeeName: emp?.fullName,
          fileName: formFileName || `${formTitle.replace(/\s+/g, '_')}.pdf`,
          fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          expiryDate: formExpiry,
          notes: formNotes,
        },
        actorInfo
      );
      setIsModalOpen(false);
      setFormTitle('');
      setFormFileName('');
      setFormExpiry('');
      setFormNotes('');
    } catch {
      alert('Failed to save document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete document record: "${title}"?`)) {
      try {
        await deleteHrDocument(id, actorInfo);
      } catch {
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Compliance &amp; Operational Document Repository
          </h2>
          <p className="text-xs text-slate-500">
            Secure digital vault for permits, passports, medical fitness cards &amp; KFC plant policies
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register Document</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Docs ({documents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No documents found matching this filter.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const evalData = doc.expiryDate ? evaluateExpiry(doc.expiryDate) : null;

            return (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete metadata"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="mt-3 font-bold text-slate-900 text-sm line-clamp-1">
                    {doc.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {doc.category}
                    </span>
                    {doc.employeeName && (
                      <span className="text-[11px] text-slate-500 truncate">
                        • {doc.employeeName}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-500 font-mono">
                    {doc.fileName} ({doc.fileSize})
                  </p>

                  {doc.notes && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div>
                    {evalData ? (
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          evalData.status === 'expired'
                            ? 'bg-red-50 text-red-700'
                            : evalData.status === 'critical'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {evalData.label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => alert(`Simulated secure preview for file: ${doc.fileName}`)}
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View File
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register Document Record</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Work Permit Copy - Ali Farhad"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Classification *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Associated Employee (Optional)
                </label>
                <select
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Company-Wide Policy / General</option>
                  {employees
                    .filter((e) => !e.isArchived)
                    .map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expiry Date (if applicable)
                </label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional compliance reference"
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
                  {isSubmitting ? 'Registering...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
