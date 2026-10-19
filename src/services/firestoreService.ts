import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Employee,
  Department,
  JobPosition,
  LeaveRecord,
  HrDocument,
  AuditLog,
  HrSetting,
  AuditAction,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_DEPARTMENTS,
  INITIAL_JOB_POSITIONS,
  INITIAL_LEAVES,
  INITIAL_DOCUMENTS,
  INITIAL_HR_SETTINGS,
} from '../data/seedData';

const EMPLOYEES_COL = 'employees';
const DEPARTMENTS_COL = 'departments';
const POSITIONS_COL = 'job_positions';
const LEAVES_COL = 'leaves';
const DOCUMENTS_COL = 'hr_documents';
const AUDIT_COL = 'audit_logs';
const SETTINGS_COL = 'hr_settings';

interface ActorInfo {
  email: string;
  name: string;
}

// System Audit Logger
export async function logAudit(
  action: AuditAction,
  details: string,
  actor: ActorInfo,
  targetId?: string
) {
  try {
    const logRef = doc(collection(db, AUDIT_COL));
    const logEntry: AuditLog = {
      id: logRef.id,
      action,
      actorEmail: actor.email || 'hr-system@kfc.mv',
      actorName: actor.name || 'HR Staff',
      details,
      targetId: targetId || '',
      timestamp: new Date().toISOString(),
    };
    await setDoc(logRef, logEntry);
  } catch (error) {
    console.warn('Failed to record audit log:', error);
  }
}

// -------------------------------------------------------------
// EMPLOYEES
// -------------------------------------------------------------
export function subscribeEmployees(
  callback: (employees: Employee[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, EMPLOYEES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Employee);
      });
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, EMPLOYEES_COL);
      if (onError) onError(err);
    }
  );
}

export async function addEmployee(
  employeeData: Omit<Employee, 'id'>,
  actor: ActorInfo
): Promise<string> {
  const colRef = collection(db, EMPLOYEES_COL);
  const newDoc = doc(colRef);
  const fullEmployee: Employee = {
    ...employeeData,
    id: newDoc.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newDoc, fullEmployee);
    await logAudit(
      'CREATE_EMPLOYEE',
      `Registered employee ${employeeData.fullName} (${employeeData.employeeId}) in ${employeeData.departmentName}`,
      actor,
      newDoc.id
    );
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, EMPLOYEES_COL);
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>,
  actor: ActorInfo
): Promise<void> {
  const docRef = doc(db, EMPLOYEES_COL, id);
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(docRef, payload);
    await logAudit(
      'UPDATE_EMPLOYEE',
      `Updated record for ${updates.fullName || id} (${updates.employeeId || ''})`,
      actor,
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EMPLOYEES_COL}/${id}`);
    throw error;
  }
}

export async function archiveEmployee(id: string, actor: ActorInfo): Promise<void> {
  return updateEmployee(
    id,
    { employmentStatus: 'archived', isArchived: true },
    actor
  );
}

export async function restoreEmployee(id: string, actor: ActorInfo): Promise<void> {
  return updateEmployee(
    id,
    { employmentStatus: 'active', isArchived: false },
    actor
  );
}

export async function bulkUpdateEmployees(
  ids: string[],
  updates: Partial<Employee>,
  actor: ActorInfo,
  actionDescription: string
): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  const timestamp = new Date().toISOString();

  ids.forEach((id) => {
    const docRef = doc(db, EMPLOYEES_COL, id);
    batch.update(docRef, {
      ...updates,
      updatedAt: timestamp,
    });
  });

  try {
    await batch.commit();
    await logAudit(
      'UPDATE_EMPLOYEE',
      `Bulk updated ${ids.length} employees: ${actionDescription}`,
      actor
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-bulk-update');
    throw error;
  }
}

export async function deleteEmployeePermanently(id: string, actor: ActorInfo): Promise<void> {
  const docRef = doc(db, EMPLOYEES_COL, id);
  try {
    await deleteDoc(docRef);
    await logAudit(
      'ARCHIVE_EMPLOYEE',
      `Permanently deleted employee record ${id}`,
      actor,
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EMPLOYEES_COL}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// DEPARTMENTS
// -------------------------------------------------------------
export function subscribeDepartments(callback: (departments: Department[]) => void) {
  const colRef = collection(db, DEPARTMENTS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Department[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Department));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, DEPARTMENTS_COL)
  );
}

export async function saveDepartment(deptData: Partial<Department> & { name: string; code: string }, actor: ActorInfo) {
  try {
    const id = deptData.id || `dept-${deptData.code.toLowerCase()}-${Date.now().toString(36)}`;
    const docRef = doc(db, DEPARTMENTS_COL, id);
    const completeDept: Department = {
      id,
      name: deptData.name,
      code: deptData.code.toUpperCase(),
      headOfDepartment: deptData.headOfDepartment || 'Unassigned',
      employeeCount: deptData.employeeCount || 0,
      description: deptData.description || '',
      createdAt: deptData.createdAt || new Date().toISOString().slice(0, 10),
    };
    await setDoc(docRef, completeDept, { merge: true });
    await logAudit('CREATE_DEPARTMENT', `Configured department: ${completeDept.name} (${completeDept.code})`, actor, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DEPARTMENTS_COL);
    throw error;
  }
}

export async function deleteDepartment(id: string, actor: ActorInfo) {
  try {
    await deleteDoc(doc(db, DEPARTMENTS_COL, id));
    await logAudit('UPDATE_DEPARTMENT', `Removed department ${id}`, actor, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DEPARTMENTS_COL}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// JOB POSITIONS
// -------------------------------------------------------------
export function subscribeJobPositions(callback: (positions: JobPosition[]) => void) {
  const colRef = collection(db, POSITIONS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: JobPosition[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as JobPosition));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, POSITIONS_COL)
  );
}

export async function saveJobPosition(pos: Omit<JobPosition, 'id'> & { id?: string }, actor: ActorInfo) {
  try {
    const id = pos.id || `pos-${Date.now().toString(36)}`;
    const docRef = doc(db, POSITIONS_COL, id);
    await setDoc(docRef, { ...pos, id }, { merge: true });
    await logAudit('SETTINGS_UPDATED', `Created/updated position ${pos.title}`, actor, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, POSITIONS_COL);
    throw error;
  }
}

export async function deleteJobPosition(id: string, actor: ActorInfo) {
  try {
    await deleteDoc(doc(db, POSITIONS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POSITIONS_COL}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// LEAVES & ATTENDANCE
// -------------------------------------------------------------
export function subscribeLeaves(callback: (leaves: LeaveRecord[]) => void) {
  const colRef = collection(db, LEAVES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: LeaveRecord[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as LeaveRecord));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, LEAVES_COL)
  );
}

export async function addLeaveRecord(leave: Omit<LeaveRecord, 'id'>, actor: ActorInfo) {
  try {
    const docRef = doc(collection(db, LEAVES_COL));
    const fullLeave: LeaveRecord = {
      ...leave,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, fullLeave);
    await logAudit(
      'RECORD_LEAVE',
      `Leave requested for ${leave.employeeName} (${leave.type}, ${leave.days} days)`,
      actor,
      docRef.id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, LEAVES_COL);
    throw error;
  }
}

export async function updateLeaveStatus(id: string, status: LeaveRecord['status'], approvedBy: string, actor: ActorInfo) {
  try {
    await updateDoc(doc(db, LEAVES_COL, id), {
      status,
      approvedBy,
    });
    await logAudit('RECORD_LEAVE', `Leave ${id} set to status: ${status} by ${approvedBy}`, actor, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${LEAVES_COL}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// HR DOCUMENTS
// -------------------------------------------------------------
export function subscribeDocuments(callback: (docs: HrDocument[]) => void) {
  const colRef = collection(db, DOCUMENTS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: HrDocument[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as HrDocument));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, DOCUMENTS_COL)
  );
}

export async function addHrDocument(docData: Omit<HrDocument, 'id'>, actor: ActorInfo) {
  try {
    const docRef = doc(collection(db, DOCUMENTS_COL));
    const fullDoc: HrDocument = {
      ...docData,
      id: docRef.id,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    await setDoc(docRef, fullDoc);
    await logAudit('DOCUMENT_RENEWED', `Uploaded document metadata: ${docData.title} (${docData.category})`, actor, docRef.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, DOCUMENTS_COL);
    throw error;
  }
}

export async function deleteHrDocument(id: string, actor: ActorInfo) {
  try {
    await deleteDoc(doc(db, DOCUMENTS_COL, id));
    await logAudit('SETTINGS_UPDATED', `Removed document record ${id}`, actor, id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DOCUMENTS_COL}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
export function subscribeAuditLogs(callback: (logs: AuditLog[]) => void) {
  const q = query(collection(db, AUDIT_COL), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AuditLog[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as AuditLog));
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, AUDIT_COL)
  );
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export function subscribeSettings(callback: (setting: HrSetting) => void) {
  const docRef = doc(db, SETTINGS_COL, 'kfc-default-settings');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as HrSetting);
      } else {
        callback(INITIAL_HR_SETTINGS);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, SETTINGS_COL)
  );
}

export async function updateHrSettings(settings: Partial<HrSetting>, actor: ActorInfo) {
  try {
    const docRef = doc(db, SETTINGS_COL, 'kfc-default-settings');
    await setDoc(docRef, settings, { merge: true });
    await logAudit('SETTINGS_UPDATED', 'Updated KFC HR operational parameters & settings', actor, 'kfc-default-settings');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_COL);
    throw error;
  }
}

// -------------------------------------------------------------
// SEEDING AND RESET UTILITY
// -------------------------------------------------------------
export async function seedKfcDemonstrationData(actor: ActorInfo): Promise<void> {
  const batch = writeBatch(db);

  // Settings
  const settingsRef = doc(db, SETTINGS_COL, 'kfc-default-settings');
  batch.set(settingsRef, INITIAL_HR_SETTINGS);

  // Departments
  INITIAL_DEPARTMENTS.forEach((dept) => {
    const ref = doc(db, DEPARTMENTS_COL, dept.id);
    batch.set(ref, dept);
  });

  // Job Positions
  INITIAL_JOB_POSITIONS.forEach((pos) => {
    const ref = doc(db, POSITIONS_COL, pos.id);
    batch.set(ref, pos);
  });

  // Employees
  INITIAL_EMPLOYEES.forEach((emp) => {
    const ref = doc(db, EMPLOYEES_COL, emp.id);
    batch.set(ref, emp);
  });

  // Leaves
  INITIAL_LEAVES.forEach((l) => {
    const ref = doc(db, LEAVES_COL, l.id);
    batch.set(ref, l);
  });

  // Documents
  INITIAL_DOCUMENTS.forEach((d) => {
    const ref = doc(db, DOCUMENTS_COL, d.id);
    batch.set(ref, d);
  });

  try {
    await batch.commit();
    await logAudit(
      'SEED_DEMO_DATA',
      'Loaded authentic KFC Maldives sample demonstration records (clearly labeled [SAMPLE DATA])',
      actor
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    throw error;
  }
}

export async function clearAllDemonstrationData(actor: ActorInfo): Promise<void> {
  try {
    // Delete sample employees
    const empSnap = await getDocs(collection(db, EMPLOYEES_COL));
    for (const d of empSnap.docs) {
      if (d.data().isSampleData) {
        await deleteDoc(d.ref);
      }
    }
    await logAudit('CLEAR_DEMO_DATA', 'Purged all sample demo employee records', actor);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, EMPLOYEES_COL);
    throw error;
  }
}
