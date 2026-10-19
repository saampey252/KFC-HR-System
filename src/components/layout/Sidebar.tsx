import React, { useState } from 'react';
import {
  TrendingUp,
  User,
  Building2,
  FileBadge,
  FileHeart,
  Plane,
  Shield,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  LogOut,
  FolderLock,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'work-permit-visa'
  | 'passport-medical'
  | 'attendance'
  | 'contracts'
  | 'documents'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  criticalAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  criticalAlertCount,
}) => {
  const { user, logout } = useAuth();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(
    currentTab === 'dashboard' || currentTab === 'departments' || currentTab === 'reports'
  );
  const [isHrisOpen, setIsHrisOpen] = useState(
    currentTab === 'employees' ||
    currentTab === 'contracts' ||
    currentTab === 'work-permit-visa' ||
    currentTab === 'passport-medical'
  );

  const isAnalyticsActive =
    currentTab === 'dashboard' || currentTab === 'departments' || currentTab === 'reports';

  const isHrisActive =
    currentTab === 'employees' ||
    currentTab === 'contracts' ||
    currentTab === 'work-permit-visa' ||
    currentTab === 'passport-medical';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header matching hr.mifco.mv */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-indigo-700 tracking-tight text-base">
              MIFCO HR
            </span>
            <span className="text-slate-400 font-light">|</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              KFC Unit
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">v2.6</span>
        </div>

        {/* Menu Items - Matching IMG_4643.png & IMG_4645.jpeg */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {/* 1. Analytics (Dropdown matching IMG_4645.jpeg) */}
          <div>
            <button
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className={`flex w-full items-center justify-between px-5 py-3 text-xs font-semibold transition ${
                isAnalyticsActive
                  ? 'bg-indigo-50/80 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span
                  className={
                    isAnalyticsActive
                      ? 'underline underline-offset-4 decoration-indigo-600 font-bold text-indigo-700'
                      : ''
                  }
                >
                  Analytics
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isAnalyticsOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {/* Analytics Submenu: Dashboard | Organisation Structure | Reports */}
            {isAnalyticsOpen && (
              <div className="bg-slate-50/70 py-1.5 pl-12 pr-4 space-y-1 text-xs">
                {/* - Dashboard */}
                <button
                  onClick={() => {
                    onSelectTab('dashboard');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'dashboard'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Dashboard
                </button>

                {/* - Organisation Structure */}
                <button
                  onClick={() => {
                    onSelectTab('departments');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'departments'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Organisation Structure
                </button>

                {/* - Reports */}
                <button
                  onClick={() => {
                    onSelectTab('reports');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'reports'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Reports
                </button>
              </div>
            )}
          </div>

          {/* 2. HRIS & Actions (Dropdown matching IMG_4643.png) */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => setIsHrisOpen(!isHrisOpen)}
              className={`flex w-full items-center justify-between px-5 py-3 text-xs font-semibold transition ${
                isHrisActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isHrisActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  <User className="h-4 w-4" />
                </div>
                <span>HRIS &amp; Actions</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isHrisOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {/* Submenu matching screenshot */}
            {isHrisOpen && (
              <div className="bg-slate-50/70 py-1.5 pl-12 pr-4 space-y-1 text-xs">
                {/* Staff Details */}
                <button
                  onClick={() => {
                    onSelectTab('employees');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'employees'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Staff Details
                </button>

                {/* Job Contract */}
                <button
                  onClick={() => {
                    onSelectTab('contracts');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'contracts'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Job Contract
                </button>

                {/* Job Description */}
                <button
                  onClick={() => {
                    onSelectTab('departments');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'departments'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Job Description
                </button>

                {/* Work Permit & Visa */}
                <button
                  onClick={() => {
                    onSelectTab('work-permit-visa');
                    onClose();
                  }}
                  className={`flex items-center justify-between w-full text-left py-1.5 transition ${
                    currentTab === 'work-permit-visa'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>– Work Permit &amp; Visa</span>
                  {criticalAlertCount > 0 && (
                    <span className="rounded-full bg-rose-500 text-white text-[9px] px-1.5 py-0.2 font-bold">
                      {criticalAlertCount}
                    </span>
                  )}
                </button>

                {/* Passport & Medical */}
                <button
                  onClick={() => {
                    onSelectTab('passport-medical');
                    onClose();
                  }}
                  className={`block w-full text-left py-1.5 transition ${
                    currentTab === 'passport-medical'
                      ? 'text-indigo-700 font-bold underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  – Passport &amp; Medical
                </button>

                {/* HR Actions */}
                <button
                  onClick={() => {
                    onSelectTab('employees');
                    onClose();
                  }}
                  className="block w-full text-left py-1.5 text-slate-500 hover:text-slate-800"
                >
                  – HR Actions (Bulk Operations)
                </button>
              </div>
            )}
          </div>

          {/* 3. Leave Management (pink plane icon) */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => {
                onSelectTab('attendance');
                onClose();
              }}
              className={`group flex w-full items-center justify-between px-5 py-3 text-xs font-semibold transition ${
                currentTab === 'attendance'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                  <Plane className="h-4 w-4" />
                </div>
                <span>Leave Management</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          {/* 4. HR Documents (emerald folder icon) */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => {
                onSelectTab('documents');
                onClose();
              }}
              className={`group flex w-full items-center justify-between px-5 py-3 text-xs font-semibold transition ${
                currentTab === 'documents'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <FolderLock className="h-4 w-4" />
                </div>
                <span>HR Documents</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>

          {/* 5. Administration (cyan badge icon) */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => {
                onSelectTab('settings');
                onClose();
              }}
              className={`group flex w-full items-center justify-between px-5 py-3 text-xs font-semibold transition ${
                currentTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                  <Shield className="h-4 w-4" />
                </div>
                <span>Administration</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.displayName || 'Isaac (HR Officer)'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                Kooddoo Complex (KFC)
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
