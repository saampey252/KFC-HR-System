/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { DepartmentsView } from './components/departments/DepartmentsView';
import { WorkPermitVisaView } from './components/tracking/WorkPermitVisaView';
import { PassportMedicalView } from './components/tracking/PassportMedicalView';
import { AttendanceLeaveView } from './components/attendance/AttendanceLeaveView';
import { ContractRenewalsView } from './components/contracts/ContractRenewalsView';
import { HrDocumentsView } from './components/documents/HrDocumentsView';
import { ReportsExportView } from './components/reports/ReportsExportView';
import { SettingsView } from './components/settings/SettingsView';
import { EmployeeModal } from './components/employees/EmployeeModal';
import { EmployeeProfileDrawer } from './components/employees/EmployeeProfileDrawer';
import { HelpDeploymentModal } from './components/common/HelpDeploymentModal';
import {
  Employee,
  Department,
  JobPosition,
  LeaveRecord,
  HrDocument,
  AuditLog,
  HrSetting,
} from './types';
import {
  subscribeEmployees,
  subscribeDepartments,
  subscribeJobPositions,
  subscribeLeaves,
  subscribeDocuments,
  subscribeAuditLogs,
  subscribeSettings,
  addEmployee,
  updateEmployee,
  archiveEmployee,
  restoreEmployee,
  seedKfcDemonstrationData,
} from './services/firestoreService';
import {
  INITIAL_EMPLOYEES,
  INITIAL_DEPARTMENTS,
  INITIAL_JOB_POSITIONS,
  INITIAL_LEAVES,
  INITIAL_DOCUMENTS,
  INITIAL_HR_SETTINGS,
} from './data/seedData';
import { evaluateExpiry } from './utils/dateUtils';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Live state from Firestore (fallback to initial data for instantaneous zero-latency render)
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>(INITIAL_JOB_POSITIONS);
  const [leaves, setLeaves] = useState<LeaveRecord[]>(INITIAL_LEAVES);
  const [documents, setDocuments] = useState<HrDocument[]>(INITIAL_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<HrSetting>(INITIAL_HR_SETTINGS);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedDrawerEmployee, setSelectedDrawerEmployee] = useState<Employee | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Firestore Subscriptions
  useEffect(() => {
    if (!user) return;

    let hasCheckedEmpty = false;

    const unsubEmp = subscribeEmployees((items) => {
      if (items.length > 0) {
        setEmployees(items);
      } else if (!hasCheckedEmpty) {
        hasCheckedEmpty = true;
        // If Firestore collection is empty, auto-seed with authentic Maldives KFC demonstration dataset
        seedKfcDemonstrationData({
          email: user.email || 'hr.admin@kooddoo.mv',
          name: user.displayName || 'HR Administrator',
        }).catch(() => {
          // If seeding fails, fallback remains visible
        });
      }
    });

    const unsubDept = subscribeDepartments((items) => {
      if (items.length > 0) setDepartments(items);
    });

    const unsubPos = subscribeJobPositions((items) => {
      if (items.length > 0) setJobPositions(items);
    });

    const unsubLeaves = subscribeLeaves((items) => {
      if (items.length > 0) setLeaves(items);
    });

    const unsubDocs = subscribeDocuments((items) => {
      if (items.length > 0) setDocuments(items);
    });

    const unsubLogs = subscribeAuditLogs((items) => {
      setAuditLogs(items);
    });

    const unsubSettings = subscribeSettings((item) => {
      setSettings(item);
    });

    return () => {
      unsubEmp();
      unsubDept();
      unsubPos();
      unsubLeaves();
      unsubDocs();
      unsubLogs();
      unsubSettings();
    };
  }, [user]);

  // Compute critical alert count for Work Permit & Visa
  const criticalCount = employees
    .filter((e) => !e.isArchived)
    .filter((e) => {
      const wp = evaluateExpiry(e.workPermitExpiry);
      const visa = evaluateExpiry(e.visaExpiry);
      return (
        wp.status === 'expired' ||
        wp.status === 'critical' ||
        visa.status === 'expired' ||
        visa.status === 'critical'
      );
    }).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">
            Initializing Kooddoo Fisheries Complex HRMS...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const actorInfo = {
    email: user.email || 'hr.admin@kooddoo.mv',
    name: user.displayName || 'HR Staff',
  };

  const handleSaveEmployee = async (empData: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, empData, actorInfo);
    } else {
      await addEmployee(empData, actorInfo);
    }
  };

  const handleArchiveEmp = async (emp: Employee) => {
    if (confirm(`Archive employee record for ${emp.fullName} (${emp.employeeId})?`)) {
      await archiveEmployee(emp.id, actorInfo);
    }
  };

  const handleRestoreEmp = async (emp: Employee) => {
    await restoreEmployee(emp.id, actorInfo);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        criticalAlertCount={criticalCount}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          employees={employees}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onOpenHelpModal={() => setIsHelpModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              departments={departments}
              leaves={leaves}
              onSelectTab={setCurrentTab}
              onOpenAddEmployee={() => {
                setEditingEmployee(null);
                setIsAddModalOpen(true);
              }}
              onSelectEmployee={(emp) => setSelectedDrawerEmployee(emp)}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeeManagementView
              employees={employees}
              departments={departments}
              onOpenAddModal={() => {
                setEditingEmployee(null);
                setIsAddModalOpen(true);
              }}
              onOpenEditModal={(emp) => {
                setEditingEmployee(emp);
                setIsAddModalOpen(true);
              }}
              onOpenProfileDrawer={(emp) => setSelectedDrawerEmployee(emp)}
              onArchiveEmployee={handleArchiveEmp}
              onRestoreEmployee={handleRestoreEmp}
              globalSearch={globalSearch}
            />
          )}

          {currentTab === 'departments' && (
            <DepartmentsView
              departments={departments}
              jobPositions={jobPositions}
              employees={employees}
            />
          )}

          {currentTab === 'work-permit-visa' && (
            <WorkPermitVisaView
              employees={employees}
              onOpenEditModal={(emp) => {
                setEditingEmployee(emp);
                setIsAddModalOpen(true);
              }}
              onOpenProfileDrawer={(emp) => setSelectedDrawerEmployee(emp)}
            />
          )}

          {currentTab === 'passport-medical' && (
            <PassportMedicalView
              employees={employees}
              onOpenProfileDrawer={(emp) => setSelectedDrawerEmployee(emp)}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceLeaveView leaves={leaves} employees={employees} />
          )}

          {currentTab === 'contracts' && (
            <ContractRenewalsView
              employees={employees}
              onOpenProfileDrawer={(emp) => setSelectedDrawerEmployee(emp)}
            />
          )}

          {currentTab === 'documents' && (
            <HrDocumentsView documents={documents} employees={employees} />
          )}

          {currentTab === 'reports' && (
            <ReportsExportView employees={employees} departments={departments} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              auditLogs={auditLogs}
              onOpenHelpModal={() => setIsHelpModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <EmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        editingEmployee={editingEmployee}
        departments={departments}
      />

      <EmployeeProfileDrawer
        employee={selectedDrawerEmployee}
        onClose={() => setSelectedDrawerEmployee(null)}
        onEdit={(emp) => {
          setSelectedDrawerEmployee(null);
          setEditingEmployee(emp);
          setIsAddModalOpen(true);
        }}
        onArchive={handleArchiveEmp}
        onRestore={handleRestoreEmp}
      />

      <HelpDeploymentModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
