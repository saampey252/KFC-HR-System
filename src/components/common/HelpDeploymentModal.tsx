import React from 'react';
import {
  X,
  BookOpen,
  Terminal,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface HelpDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDeploymentModal: React.FC<HelpDeploymentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                KFC HRMS — Setup &amp; Deployment Guide
              </h3>
              <p className="text-xs text-slate-500">
                Kooddoo Fisheries Complex Employment Management System
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

        {/* Content */}
        <div className="mt-6 space-y-6 text-xs text-slate-600 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Overview & Stack */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>1. System Architecture</span>
            </h4>
            <p className="leading-relaxed">
              This system is built for the HR and Expatriate Compliance department at{' '}
              <strong>Kooddoo Fisheries Complex (KFC), Gaafu Alifu Atoll, Maldives</strong>. It tracks both
              local Maldivian staff and multinational expatriate workers across blast freezing, cold storage,
              marine fleet, and tuna canning operations.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="rounded bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Frontend</span>
                <strong>React 19 &amp; Vite</strong>
              </div>
              <div className="rounded bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Language</span>
                <strong>TypeScript</strong>
              </div>
              <div className="rounded bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Database</span>
                <strong>Cloud Firestore</strong>
              </div>
              <div className="rounded bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Authentication</span>
                <strong>Firebase Auth</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Security & HR-Only Policy */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>2. HR-Only Access Policy &amp; Security Rules</span>
            </h4>
            <p className="leading-relaxed">
              In accordance with KFC internal security, no public self-registration or employee self-service is permitted.
              Access is restricted to authorized HR personnel whose Google accounts match the authorized email allowlist
              (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">isaamiu@gmail.com</code>).
            </p>
            <p className="leading-relaxed">
              Firestore security rules are deployed to protect employee personal data, medical clearances, and work permit IDs:
            </p>
            <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`// firestore.rules
match /employees/{employeeId} {
  allow read, write: if request.auth != null;
}
match /audit_logs/{logId} {
  allow read, write: if request.auth != null;
}`}
            </pre>
          </div>

          {/* Section 3: Excel Data Import & Export */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span>3. Excel Integration &amp; Template</span>
            </h4>
            <p className="leading-relaxed">
              The system provides bi-directional Excel data interchange via the <strong>Reports &amp; Excel</strong> module:
            </p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>
                <strong>Master Export:</strong> Downloads an active <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.xlsx</code> spreadsheet containing full employee profiles and an automatic Compliance Expiry sheet.
              </li>
              <li>
                <strong>Batch Import:</strong> Upload any spreadsheet with columns <em>Employee ID, Full Name, Passport, Nationality, Department, Job Title, Work Permit Number, Work Permit Expiry, Medical Expiry, Contract Expiry</em>.
              </li>
              <li>
                <strong>Validation:</strong> The parser validates dates and flags incomplete records before writing to Firestore.
              </li>
            </ul>
          </div>

          {/* Section 4: Production Deployment Steps */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>4. Deployment Commands</span>
            </h4>
            <p className="leading-relaxed">
              To build and deploy the production bundle to Cloud Run, Firebase Hosting, or custom container:
            </p>
            <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-slate-200 overflow-x-auto space-y-1">
              <div><span className="text-slate-500"># 1. Install dependencies</span></div>
              <div className="text-emerald-400">npm install</div>
              <div className="pt-1"><span className="text-slate-500"># 2. Build production assets</span></div>
              <div className="text-emerald-400">npm run build</div>
              <div className="pt-1"><span className="text-slate-500"># 3. Preview production bundle</span></div>
              <div className="text-emerald-400">npm run preview</div>
            </pre>
          </div>

          {/* Section 5: Regulatory Compliance Note */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-1 text-blue-900">
            <strong className="block font-semibold">Maldives Regulatory Compliance Checklist:</strong>
            <p className="text-[11px] leading-relaxed">
              Work permit renewals should be filed at least 15 to 30 days prior to expiry on the Maldives XPAT Online system to prevent the Ministry fine of MVR 2,000 per violation. All food and seafood handlers at Kooddoo must renew their HPA medical fitness certificates annually.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
