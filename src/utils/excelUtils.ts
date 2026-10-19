import * as XLSX from 'xlsx';
import { Employee } from '../types';
import { evaluateExpiry } from './dateUtils';

export function exportEmployeesToExcel(employees: Employee[], fileNamePrefix = 'KFC_Employees') {
  // 1. Prepare Main Employees Data
  const mainData = employees.map((emp) => {
    const wpEval = evaluateExpiry(emp.workPermitExpiry);
    const passEval = evaluateExpiry(emp.passportExpiry);
    const medEval = evaluateExpiry(emp.medicalExpiry);
    const contractEval = evaluateExpiry(emp.contractExpiry);

    return {
      'Employee ID': emp.employeeId,
      'Full Name': emp.fullName,
      'Passport / ID Number': emp.passportNumber,
      'Nationality': emp.nationality,
      'Department': emp.departmentName,
      'Job Title': emp.jobTitle,
      'Joining Date': emp.joiningDate,
      'Employment Status': emp.employmentStatus.toUpperCase(),
      'Work Permit Number': emp.workPermitNumber || 'N/A',
      'Work Permit Expiry': emp.workPermitExpiry || 'N/A',
      'Work Permit Status': wpEval.label,
      'Visa Expiry': emp.visaExpiry || 'N/A',
      'Passport Expiry': emp.passportExpiry || 'N/A',
      'Passport Status': passEval.label,
      'Medical Expiry': emp.medicalExpiry || 'N/A',
      'Medical Status': medEval.label,
      'Contract Expiry': emp.contractExpiry || 'N/A',
      'Contract Status': contractEval.label,
      'Gender': emp.gender || '',
      'Email': emp.email || '',
      'Phone': emp.phone || '',
      'Accommodation / Quarters': emp.islandOrCamp || '',
      'Emergency Contact': emp.emergencyContact || '',
      'Notes': emp.notes || '',
    };
  });

  // 2. Prepare Compliance Expiry Summary Sheet
  const complianceData = employees
    .filter((emp) => !emp.isArchived)
    .flatMap((emp) => {
      const items = [];
      if (emp.workPermitExpiry) {
        const ev = evaluateExpiry(emp.workPermitExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          items.push({
            'Employee ID': emp.employeeId,
            'Name': emp.fullName,
            'Department': emp.departmentName,
            'Document Type': 'Work Permit',
            'Doc Number': emp.workPermitNumber || '—',
            'Expiry Date': emp.workPermitExpiry,
            'Days Left': ev.daysRemaining ?? '—',
            'Compliance Status': ev.status === 'expired' ? 'EXPIRED' : 'EXPIRING (<30 DAYS)',
          });
        }
      }
      if (emp.passportExpiry) {
        const ev = evaluateExpiry(emp.passportExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          items.push({
            'Employee ID': emp.employeeId,
            'Name': emp.fullName,
            'Department': emp.departmentName,
            'Document Type': 'Passport',
            'Doc Number': emp.passportNumber,
            'Expiry Date': emp.passportExpiry,
            'Days Left': ev.daysRemaining ?? '—',
            'Compliance Status': ev.status === 'expired' ? 'EXPIRED' : 'EXPIRING (<30 DAYS)',
          });
        }
      }
      if (emp.medicalExpiry) {
        const ev = evaluateExpiry(emp.medicalExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          items.push({
            'Employee ID': emp.employeeId,
            'Name': emp.fullName,
            'Department': emp.departmentName,
            'Document Type': 'HPA Medical Fitness',
            'Doc Number': 'Medical Cert',
            'Expiry Date': emp.medicalExpiry,
            'Days Left': ev.daysRemaining ?? '—',
            'Compliance Status': ev.status === 'expired' ? 'EXPIRED' : 'EXPIRING (<30 DAYS)',
          });
        }
      }
      if (emp.contractExpiry) {
        const ev = evaluateExpiry(emp.contractExpiry);
        if (ev.status === 'expired' || ev.status === 'critical') {
          items.push({
            'Employee ID': emp.employeeId,
            'Name': emp.fullName,
            'Department': emp.departmentName,
            'Document Type': 'Employment Contract',
            'Doc Number': 'Tenure Contract',
            'Expiry Date': emp.contractExpiry,
            'Days Left': ev.daysRemaining ?? '—',
            'Compliance Status': ev.status === 'expired' ? 'EXPIRED' : 'EXPIRING (<30 DAYS)',
          });
        }
      }
      return items;
    });

  const wb = XLSX.utils.book_new();

  const wsEmployees = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employee Master');

  const wsCompliance = XLSX.utils.json_to_sheet(
    complianceData.length > 0
      ? complianceData
      : [{ 'Status': 'All documents are currently in full compliance (>30 days valid)' }]
  );
  XLSX.utils.book_append_sheet(wb, wsCompliance, 'Expiry Compliance Alerts');

  const nowStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${nowStr}.xlsx`);
}

export function downloadEmployeeImportTemplate() {
  const templateRows = [
    {
      'Employee ID': 'KFC-0301',
      'Full Name': 'Ahmed Latheef',
      'Passport / ID Number': 'A4910291',
      'Nationality': 'Maldivian',
      'Department': 'Fish Processing & Canning',
      'Job Title': 'Blast Freezer Tech',
      'Joining Date': '2025-01-15',
      'Employment Status': 'active',
      'Work Permit Number': 'EXEMPT',
      'Work Permit Expiry': '',
      'Visa Expiry': '',
      'Passport Expiry': '2030-05-12',
      'Medical Expiry': '2027-02-15',
      'Contract Expiry': '2027-01-15',
      'Gender': 'Male',
      'Email': 'ahmed.latheef@kfc.mv',
      'Phone': '+960 771-0022',
      'Accommodation / Quarters': 'Local Quarters Block 1',
      'Emergency Contact': 'Aminath (Sister) - 772-9901',
      'Notes': 'HACCP trained',
    },
    {
      'Employee ID': 'KFC-0302',
      'Full Name': 'Ratan Mondal',
      'Passport / ID Number': 'EG8829102',
      'Nationality': 'Bangladeshi',
      'Department': 'Cold Storage & Freezing',
      'Job Title': 'Refrigeration Helper',
      'Joining Date': '2024-08-10',
      'Employment Status': 'active',
      'Work Permit Number': 'WP-MV-2024-99102',
      'Work Permit Expiry': '2027-08-09',
      'Visa Expiry': '2027-08-09',
      'Passport Expiry': '2028-12-01',
      'Medical Expiry': '2027-04-20',
      'Contract Expiry': '2027-08-09',
      'Gender': 'Male',
      'Email': 'ratan.m@kfc.mv',
      'Phone': '+960 994-1188',
      'Accommodation / Quarters': 'Expat Dorm B Room 10',
      'Emergency Contact': 'Shanto Mondal - +880 1711-223344',
      'Notes': 'Refrigeration certified',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Employees Template');
  XLSX.writeFile(wb, 'KFC_Employee_Import_Template.xlsx');
}

export interface ParseResult {
  employees: Omit<Employee, 'id'>[];
  errors: string[];
  totalRows: number;
}

export function parseExcelFile(data: ArrayBuffer): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const employees: Omit<Employee, 'id'>[] = [];
      const errors: string[] = [];

      rawRows.forEach((row, index) => {
        const rowNum = index + 2; // header is row 1
        // Normalize keys
        const getVal = (possibleKeys: string[]): string => {
          for (const key of possibleKeys) {
            const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
              return String(row[foundKey]).trim();
            }
          }
          return '';
        };

        const fullName = getVal(['Full Name', 'Name', 'FullName']);
        const employeeId = getVal(['Employee ID', 'ID', 'EmpID', 'EmployeeID']);
        const passportNumber = getVal(['Passport / ID Number', 'Passport', 'ID Card', 'National ID']);
        const nationality = getVal(['Nationality', 'Country']) || 'Maldivian';
        const departmentName = getVal(['Department', 'Dept']) || 'Fish Processing & Canning';
        const jobTitle = getVal(['Job Title', 'Designation', 'Position']) || 'Staff';
        const joiningDate = getVal(['Joining Date', 'Joined Date']) || new Date().toISOString().slice(0, 10);
        const employmentStatusRaw = getVal(['Employment Status', 'Status']).toLowerCase();
        
        let employmentStatus: Employee['employmentStatus'] = 'active';
        if (employmentStatusRaw.includes('leave')) employmentStatus = 'on_leave';
        else if (employmentStatusRaw.includes('probat')) employmentStatus = 'probation';
        else if (employmentStatusRaw.includes('archiv')) employmentStatus = 'archived';

        if (!fullName) {
          errors.push(`Row ${rowNum}: Missing Full Name`);
          return;
        }

        const generatedId = employeeId || `KFC-${Math.floor(1000 + Math.random() * 9000)}`;

        employees.push({
          employeeId: generatedId,
          fullName,
          passportNumber: passportNumber || 'PENDING',
          nationality,
          departmentId: 'dept-proc',
          departmentName,
          jobTitle,
          joiningDate,
          employmentStatus,
          workPermitNumber: getVal(['Work Permit Number', 'Work Permit', 'WP No']),
          workPermitExpiry: getVal(['Work Permit Expiry', 'WP Expiry']),
          visaExpiry: getVal(['Visa Expiry', 'Visa']),
          passportExpiry: getVal(['Passport Expiry']),
          medicalExpiry: getVal(['Medical Expiry', 'Medical Fitness']),
          contractExpiry: getVal(['Contract Expiry', 'Contract']),
          gender: (getVal(['Gender']) as 'Male' | 'Female') || 'Male',
          email: getVal(['Email']),
          phone: getVal(['Phone', 'Mobile']),
          islandOrCamp: getVal(['Accommodation / Quarters', 'Camp', 'Room', 'Quarters']),
          emergencyContact: getVal(['Emergency Contact']),
          notes: getVal(['Notes', 'Remarks']),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isSampleData: false,
        });
      });

      resolve({
        employees,
        errors,
        totalRows: rawRows.length,
      });
    } catch (err: unknown) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
