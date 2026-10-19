export type EmploymentStatus = 'active' | 'on_leave' | 'probation' | 'archived';

export interface Employee {
  id: string;
  employeeId: string; // e.g. 101758 or KFC-0012
  shortName?: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  joiningDate: string; // YYYY-MM-DD
  employmentStatus: EmploymentStatus;
  
  // Document tracking fields (real YYYY-MM-DD dates)
  workPermitNumber?: string;
  workPermitExpiry?: string; // YYYY-MM-DD
  visaNumber?: string;
  visaExpiry?: string;       // YYYY-MM-DD
  quotaSlotNumber?: string;
  passportExpiry?: string;   // YYYY-MM-DD
  medicalExpiry?: string;    // YYYY-MM-DD
  medicalFitStatus?: 'fit' | 'unfit' | 'pending';
  contractType?: 'fixed_term' | 'indefinite' | 'probationary';
  contractExpiry?: string;   // YYYY-MM-DD
  nationalIdOrIqama?: string;

  gender?: 'Male' | 'Female' | 'Other';
  email?: string;
  phone?: string;
  islandOrCamp?: string; // e.g. Kooddoo Island Block A, Processing Quarters
  emergencyContact?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  isSampleData?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  employeeCount?: number;
  description: string;
  createdAt: string;
}

export interface JobPosition {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  level: 'Executive' | 'Supervisory' | 'Skilled Technical' | 'Operations & Plant' | 'General Support';
  description?: string;
}

export type LeaveType = 'annual_leave' | 'medical_leave' | 'emergency_leave' | 'home_leave_repatriation' | 'compassionate_leave';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;
  status: LeaveStatus;
  reason: string;
  approvedBy?: string;
  createdAt: string;
}

export type DocumentCategory = 
  | 'Work Permit'
  | 'Visa Copy'
  | 'Passport Copy'
  | 'Medical Fitness Clearance'
  | 'Employment Contract'
  | 'KFC Safety & Health Cert'
  | 'Company Policy';

export interface HrDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  employeeId?: string;
  employeeName?: string;
  docUrl?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
}

export type AuditAction = 
  | 'CREATE_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'ARCHIVE_EMPLOYEE'
  | 'RESTORE_EMPLOYEE'
  | 'DOCUMENT_RENEWED'
  | 'CREATE_DEPARTMENT'
  | 'UPDATE_DEPARTMENT'
  | 'RECORD_LEAVE'
  | 'IMPORT_EXCEL'
  | 'SETTINGS_UPDATED'
  | 'SEED_DEMO_DATA'
  | 'CLEAR_DEMO_DATA';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorEmail: string;
  actorName: string;
  details: string;
  targetId?: string;
  timestamp: string;
}

export interface HrSetting {
  id: string;
  companyName: string;
  location: string;
  atoll: string;
  expiryThresholdDays: number;
  authorizedHrEmails: string[];
  enableEmailAlerts: boolean;
  contactEmail: string;
  contactPhone: string;
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'valid' | 'none';

export interface ExpiryEvaluation {
  status: ExpiryStatus;
  daysRemaining: number | null;
  formattedDate: string;
  label: string;
}
