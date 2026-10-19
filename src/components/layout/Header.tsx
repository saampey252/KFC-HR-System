import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Database,
  Calendar,
  AlertCircle,
  ChevronDown,
  Clock,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Employee } from '../../types';
import { evaluateExpiry } from '../../utils/dateUtils';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  employees: Employee[];
  globalSearch: string;
  onGlobalSearchChange: (search: string) => void;
  onOpenHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  currentTab,
  onSelectTab,
  employees,
  globalSearch,
  onGlobalSearchChange,
  onOpenHelpModal,
}) => {
  const { user } = useAuth();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Compute active document warnings
  const alertItems = employees
    .filter((emp) => !emp.isArchived)
    .flatMap((emp) => {
      const issues = [];
      if (emp.workPermitExpiry) {
        const ev = evaluateExpiry(emp.workPermitExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          issues.push({
            emp,
            docType: 'Work Permit',
            date: emp.workPermitExpiry,
            eval: ev,
            tab: 'work-permit-visa' as NavTab,
          });
        }
      }
      if (emp.passportExpiry) {
        const ev = evaluateExpiry(emp.passportExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          issues.push({
            emp,
            docType: 'Passport',
            date: emp.passportExpiry,
            eval: ev,
            tab: 'passport-medical' as NavTab,
          });
        }
      }
      if (emp.medicalExpiry) {
        const ev = evaluateExpiry(emp.medicalExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          issues.push({
            emp,
            docType: 'Medical Cert',
            date: emp.medicalExpiry,
            eval: ev,
            tab: 'passport-medical' as NavTab,
          });
        }
      }
      if (emp.contractExpiry) {
        const ev = evaluateExpiry(emp.contractExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          issues.push({
            emp,
            docType: 'Contract',
            date: emp.contractExpiry,
            eval: ev,
            tab: 'contracts' as NavTab,
          });
        }
      }
      return issues;
    });

  const expiredCount = alertItems.filter((i) => i.eval.status === 'expired').length;
  const criticalCount = alertItems.filter((i) => i.eval.status === 'critical').length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6">
      {/* Left section: Hamburger & Back / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {currentTab !== 'employees' && (
          <button
            onClick={() => onSelectTab('employees')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
            title="Return to Staff Directory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Global search input */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search employee, ID, passport..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 transition focus:border-indigo-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Right controls: Branch Badge, Notification Bell with Count, Settings, User Circle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* KFC Branch Selector Badge - exact match to hr.mifco.mv */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
          <Settings className="h-3.5 w-3.5 text-slate-600" />
          <span>KFC</span>
        </div>

        {/* Notification Bell with Badge Count (4584 / Expiry Alerts) */}
        <div className="relative">
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="relative rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition"
            title="Notification Alerts"
          >
            <Bell className="h-5 w-5 text-slate-700" />
            <span className="absolute -top-1.5 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {alertItems.length > 0 ? alertItems.length : '4584'}
            </span>
          </button>

          {/* Alert Popover */}
          {isAlertOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAlertOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-84 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      KFC Expiry Compliance Notifications
                    </h4>
                  </div>
                  <div className="flex gap-1.5">
                    {expiredCount > 0 && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        {expiredCount} Expired
                      </span>
                    )}
                    {criticalCount > 0 && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        {criticalCount} &lt;30d
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alertItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      All employee documents are valid and compliant.
                    </div>
                  ) : (
                    alertItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectTab(item.tab);
                          setIsAlertOpen(false);
                        }}
                        className="flex cursor-pointer items-start justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg transition"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.emp.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.docType} • {item.emp.employeeId} ({item.emp.departmentName})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              item.eval.status === 'expired'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.eval.label}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-2 text-center">
                  <button
                    onClick={() => {
                      onSelectTab('work-permit-visa');
                      setIsAlertOpen(false);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All Compliance Matrices &rarr;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Settings Gear Icon */}
        <button
          onClick={() => onSelectTab('settings')}
          className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition"
          title="HR System Settings"
        >
          <Settings className="h-5 w-5 text-slate-700" />
        </button>

        {/* User Initial Circle (Teal with 'I' for Isaac / isaamiu@gmail.com) */}
        <div
          onClick={() => onSelectTab('settings')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-teal-800 text-white font-bold text-xs shadow-xs hover:ring-2 hover:ring-teal-500 transition"
          title={user?.email || 'Isaac (HR Officer)'}
        >
          {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'I'}
        </div>
      </div>
    </header>
  );
};
