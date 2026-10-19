import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  History,
  Database,
  Building,
  Mail,
  Phone,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { HrSetting, AuditLog } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import {
  updateHrSettings,
  seedKfcDemonstrationData,
  clearAllDemonstrationData,
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface SettingsViewProps {
  settings: HrSetting;
  auditLogs: AuditLog[];
  onOpenHelpModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  onOpenHelpModal,
}) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'audit' | 'data'>('config');

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [location, setLocation] = useState(settings.location);
  const [atoll, setAtoll] = useState(settings.atoll);
  const [threshold, setThreshold] = useState(settings.expiryThresholdDays || 30);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'hr@kfc.mv');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '+960 682-0100');
  const [authorizedEmails, setAuthorizedEmails] = useState(
    (settings.authorizedHrEmails || []).join(', ')
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const actorInfo = {
    email: user?.email || 'hr.admin@kooddoo.mv',
    name: user?.displayName || 'HR Administrator',
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const emailList = authorizedEmails
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateHrSettings(
        {
          companyName,
          location,
          atoll,
          expiryThresholdDays: Number(threshold) || 30,
          contactEmail,
          contactPhone,
          authorizedHrEmails: emailList,
        },
        actorInfo
      );
      setSaveMessage('HR settings saved successfully.');
    } catch {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedData = async () => {
    if (confirm('Load realistic Maldives Kooddoo Fisheries Complex demonstration records? (All records clearly labeled [SAMPLE DATA])')) {
      try {
        await seedKfcDemonstrationData(actorInfo);
        alert('Demonstration dataset loaded successfully into Cloud Firestore.');
      } catch {
        alert('Failed to load demo data');
      }
    }
  };

  const handleClearDemoData = async () => {
    if (confirm('Remove all records labeled as sample demonstration data? Real records will be preserved.')) {
      try {
        await clearAllDemonstrationData(actorInfo);
        alert('Sample demo data cleared.');
      } catch {
        alert('Failed to clear demo data');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            System Settings &amp; Compliance Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Configure Kooddoo Fisheries Complex HR policies, expiry alerts, authorized officers &amp; audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveSubTab('config')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSubTab === 'config'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HR Config
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSubTab === 'audit'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('data')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSubTab === 'data'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Utilities
            </button>
          </div>

          <button
            onClick={onOpenHelpModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>Deployment Guide</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Configuration Form */}
      {activeSubTab === 'config' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {saveMessage && (
              <div
                className={`rounded-xl p-3 text-xs font-medium ${
                  saveMessage.includes('Success') || saveMessage.includes('successfully')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {saveMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complex / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Location (Island &amp; Atoll)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Expiry Critical Warning Threshold (Days)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Documents expiring within this timeframe will trigger amber &amp; red badges.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HR Department Contact Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorized HR Email Allowlist (Comma-separated)
                </label>
                <input
                  type="text"
                  value={authorizedEmails}
                  onChange={(e) => setAuthorizedEmails(e.target.value)}
                  placeholder="e.g. isaamiu@gmail.com, hr.admin@kooddoo.mv"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Only users authenticating with these Google accounts can access this portal.
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSaving ? 'Saving Changes...' : 'Save HR Parameters'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subtab 2: Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">System Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable activity log recording all changes made by HR personnel
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {auditLogs.length} events recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">HR Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No audit activities logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        <span className="font-semibold text-slate-700 block">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400">{log.actorEmail}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Demo Utilities */}
      {activeSubTab === 'data' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Realistic Sample Data Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Demonstration records for Kooddoo Fisheries Complex are clearly labeled with{' '}
              <span className="font-semibold text-blue-600">[SAMPLE DATA]</span> badges.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Reload Authentic Maldives KFC Dataset
                </h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Seeds departments (Canning, Cold Store, Ammonia Engineering, QA, Fleet), real positions,
                  authentic Maldivian &amp; expatriate employee records with expired &amp; &lt;30-day compliance dates.
                </p>
              </div>
              <button
                onClick={handleSeedData}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Load Demonstration Records</span>
              </button>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-red-900 text-sm">
                  Purge All Sample Demonstration Records
                </h4>
                <p className="mt-1 text-xs text-red-700/80 leading-relaxed">
                  Permanently deletes only the records flagged as demonstration sample data from Cloud Firestore.
                  Your manually added employee records are strictly kept.
                </p>
              </div>
              <button
                onClick={handleClearDemoData}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>Purge Sample Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
