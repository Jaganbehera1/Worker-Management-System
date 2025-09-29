export interface Employee {
  id: string;
  name: string;
  designation: string;
  contactNumber: string;
  dailyWage: number;
  createdAt: string;
  photo?: string; // base64 encoded image
}

export interface AttendanceRecord {
  id?: string;
  employeeId: string;
  date: string;
  present: boolean;
  late?: boolean;
  weekStart: string; // Monday of the week
}

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  description: string;
}

export interface WeeklySummary {
  weekStart: string;
  daysWorked: number;
  totalWages: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'viewer';
}

export interface AttendanceStatus {
  present: boolean;
  late?: boolean;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  vehicleType: string;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  fuelAmount: number; // in liters
  fuelCost: number; // in rupees
  description?: string;
  createdAt: string;
}
// Add to your existing types in types.ts
export interface SalaryPayment {
  id: string;
  employeeId: string;
  paymentDate: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface MonthlyReport {
  employeeId: string;
  month: string;
  totalDaysWorked: number;
  baseWages: number;
  additionalEarnings: number; // Add this
  totalWagesEarned: number;
  totalAdvancesTaken: number;
  totalSalaryPaid: number;
  finalAmount: number;
  attendanceDetails: AttendanceRecord[];
  advanceDetails: Advance[];
  salaryPaymentDetails: SalaryPayment[];
  otRecords: AttendanceRecord[]; // Add this
  halfDayRecords: AttendanceRecord[]; // Add this
  customPaymentRecords: AttendanceRecord[]; // Add this
}
// In your types file
export interface AttendanceRecord {
  id?: string;
  employeeId: string;
  date: string;
  weekStart: string;
  present: boolean;
  late?: boolean;
  customType?: 'ot' | 'half-day' | 'custom';
  customAmount?: number;
  notes?: string;
  otHours?: number;
  otRate?: number;
}