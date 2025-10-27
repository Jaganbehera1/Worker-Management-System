import React, { useState } from 'react';
import { Employee, AttendanceRecord, Advance } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { FileText, Download, User, Search, Database } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { pdf } from '@react-pdf/renderer';
import ProfessionalPayslipPDF from './ProfessionalPayslipPDF';

// Define SalaryPayment type locally if not in types.ts
interface SalaryPayment {
  id: string;
  employeeId: string;
  paymentDate: string;
  amount: number;
  description: string;
  createdAt: string;
}

// Extended interface for our report
interface ExtendedMonthlyReport {
  employeeId: string;
  month: string;
  totalDaysWorked: number;
  baseWages: number;
  additionalEarnings: number;
  totalWagesEarned: number;
  totalAdvancesTaken: number;
  totalSalaryPaid: number;
  finalAmount: number;
  attendanceDetails: AttendanceRecord[];
  advanceDetails: Advance[];
  salaryPaymentDetails: SalaryPayment[];
  otRecords: AttendanceRecord[];
  halfDayRecords: AttendanceRecord[];
  customPaymentRecords: AttendanceRecord[];
}

interface ReportManagerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  advances: Advance[];
  userRole: 'admin' | 'viewer';
}

const ReportManager: React.FC<ReportManagerProps> = ({
  employees,
  attendance,
  advances,
  userRole,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [includeAllHistory, setIncludeAllHistory] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Use Firestore for salary payments
  const { data: salaryPayments, loading: salaryPaymentsLoading } = useFirestore<SalaryPayment>('salaryPayments');

  const generateMonthlyReport = (employeeId: string, month: string): ExtendedMonthlyReport | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;
    let monthAttendance: AttendanceRecord[] = [];
    let monthAdvances: Advance[] = [];
    let monthSalaryPayments: SalaryPayment[] = [];

    if (includeAllHistory) {
      // Use all history for the employee
      monthAttendance = attendance.filter(a => a.employeeId === employeeId);
      monthAdvances = advances.filter(a => a.employeeId === employeeId);
      monthSalaryPayments = salaryPayments.filter(p => p.employeeId === employeeId);
    } else {
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      // Get records for the month
      monthAttendance = attendance.filter(a => {
        const attendanceDate = new Date(a.date);
        return a.employeeId === employeeId && 
               attendanceDate >= monthStart && 
               attendanceDate <= monthEnd;
      });

      monthAdvances = advances.filter(a => {
        const advanceDate = new Date(a.date);
        return a.employeeId === employeeId && 
               advanceDate >= monthStart && 
               advanceDate <= monthEnd;
      });

      monthSalaryPayments = salaryPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return p.employeeId === employeeId && 
               paymentDate >= monthStart && 
               paymentDate <= monthEnd;
      });
    }

    // Calculate totals
    const totalDaysWorked = monthAttendance.filter(a => a.present).length;
    
    let baseWages = 0;
    let additionalEarnings = 0;

    monthAttendance.forEach(record => {
      if (record.present) {
        baseWages += employee.dailyWage;
      }
      
      if (record.customAmount) {
        additionalEarnings += record.customAmount;
      }
    });

    const totalWagesEarned = baseWages + additionalEarnings;
    const totalAdvancesTaken = monthAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalSalaryPaid = monthSalaryPayments.reduce((sum, p) => sum + p.amount, 0);
    const finalAmount = totalWagesEarned - totalAdvancesTaken - totalSalaryPaid;

    // Categorize attendance records
    const otRecords = monthAttendance.filter(record => record.customType === 'ot');
    const halfDayRecords = monthAttendance.filter(record => record.customType === 'half-day');
    const customPaymentRecords = monthAttendance.filter(record => record.customType === 'custom');

    return {
      employeeId,
      month,
      totalDaysWorked,
      baseWages,
      additionalEarnings,
      totalWagesEarned,
      totalAdvancesTaken,
      totalSalaryPaid,
      finalAmount,
      attendanceDetails: monthAttendance,
      advanceDetails: monthAdvances,
      salaryPaymentDetails: monthSalaryPayments,
      otRecords,
      halfDayRecords,
      customPaymentRecords,
    };
  };

  const formatBalance = (balance: number) => {
    if (balance === 0) return formatCurrency(0);
    if (balance > 0) return `+${formatCurrency(balance)}`;
    return `-${formatCurrency(Math.abs(balance))}`;
  };

  const downloadPDF = async () => {
    if (!monthlyReport || !selectedEmployeeData) return;

    setIsGeneratingPDF(true);
    
    try {
      // Create the PDF document
      const doc = <ProfessionalPayslipPDF employee={selectedEmployeeData} report={monthlyReport} />;
      
      // Generate PDF blob
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEmployeeData.name.replace(/\s+/g, '_')}_${selectedMonth}_payslip.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadTextReport = () => {
    if (!monthlyReport || !selectedEmployeeData) return;

    const reportContent = `
MONTHLY PAYSLIP REPORT
======================

Employee Details:
Name: ${selectedEmployeeData.name}
Designation: ${selectedEmployeeData.designation}
Contact: ${selectedEmployeeData.contactNumber}
Daily Wage: ${formatCurrency(selectedEmployeeData.dailyWage)}

Report Period: ${new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}

EARNINGS BREAKDOWN:
Base Wages (${monthlyReport.totalDaysWorked} days × ${formatCurrency(selectedEmployeeData.dailyWage)}): ${formatCurrency(monthlyReport.baseWages)}
Additional Earnings: ${formatCurrency(monthlyReport.additionalEarnings)}
${monthlyReport.otRecords.length > 0 ? `Overtime (${monthlyReport.otRecords.length} days): ${formatCurrency(monthlyReport.otRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}` : ''}
${monthlyReport.halfDayRecords.length > 0 ? `Half Days (${monthlyReport.halfDayRecords.length} days): ${formatCurrency(monthlyReport.halfDayRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}` : ''}
${monthlyReport.customPaymentRecords.length > 0 ? `Custom Payments (${monthlyReport.customPaymentRecords.length}): ${formatCurrency(monthlyReport.customPaymentRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}` : ''}
Total Wages Earned: ${formatCurrency(monthlyReport.totalWagesEarned)}

DEDUCTIONS:
Advances Taken: ${formatCurrency(monthlyReport.totalAdvancesTaken)}
Salary Already Paid: ${formatCurrency(monthlyReport.totalSalaryPaid)}

FINAL CALCULATION:
Total Wages Earned: ${formatCurrency(monthlyReport.totalWagesEarned)}
Less: Advances: ${formatCurrency(monthlyReport.totalAdvancesTaken)}
Less: Salary Paid: ${formatCurrency(monthlyReport.totalSalaryPaid)}
Final Amount: ${formatBalance(monthlyReport.finalAmount)}

Generated on: ${new Date().toLocaleDateString('en-IN')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEmployeeData.name.replace(/\s+/g, '_')}_${selectedMonth}_payslip.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Preview Component for display
  const PayslipPreview: React.FC<{ employee: Employee; report: ExtendedMonthlyReport }> = ({ 
    employee, 
    report 
  }) => {
    const getMonthYear = (monthString: string) => {
      return new Date(monthString + '-01').toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
      });
    };

    return (
      <div className="bg-white p-6 max-w-4xl mx-auto border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JJ Construction</h1>
                <p className="text-gray-600 text-sm">Construction Site Office, Main Road</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600">PAYSLIP</h2>
              <p className="text-gray-600 font-medium">{getMonthYear(report.month)}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-medium text-blue-600">Days Worked</p>
            <p className="text-lg font-bold text-blue-900">{report.totalDaysWorked}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs font-medium text-green-600">Total Earnings</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(report.totalWagesEarned)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-medium text-orange-600">Advances</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(report.totalAdvancesTaken)}</p>
          </div>
          <div className={`rounded-lg p-3 border ${
            report.finalAmount === 0 ? 'bg-green-50 border-green-200' :
            report.finalAmount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-xs font-medium ${
              report.finalAmount === 0 ? 'text-green-600' :
              report.finalAmount > 0 ? 'text-blue-600' : 'text-yellow-600'
            }`}>
              Net Amount
            </p>
            <p className={`text-lg font-bold ${
              report.finalAmount === 0 ? 'text-green-900' :
              report.finalAmount > 0 ? 'text-blue-900' : 'text-yellow-900'
            }`}>
              {formatBalance(report.finalAmount)}
            </p>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Employee</p>
              <p className="text-gray-600">{employee.name} - {employee.designation}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Daily Wage</p>
              <p className="text-gray-600">{formatCurrency(employee.dailyWage)}</p>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Wages:</span>
            <span className="font-medium text-green-600">+{formatCurrency(report.baseWages)}</span>
          </div>
          {report.additionalEarnings > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Additional Earnings:</span>
              <span className="font-medium text-blue-600">+{formatCurrency(report.additionalEarnings)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-semibold text-gray-700">Total Earnings:</span>
            <span className="font-semibold text-green-600">+{formatCurrency(report.totalWagesEarned)}</span>
          </div>
        </div>

        {/* Deductions Summary */}
        <div className="space-y-2 text-sm mt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Advances Taken:</span>
            <span className="font-medium text-orange-600">-{formatCurrency(report.totalAdvancesTaken)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Salary Paid:</span>
            <span className="font-medium text-orange-600">-{formatCurrency(report.totalSalaryPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-semibold text-gray-700">Total Deductions:</span>
            <span className="font-semibold text-orange-600">-{formatCurrency(report.totalAdvancesTaken + report.totalSalaryPaid)}</span>
          </div>
        </div>

        {/* Final Amount */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Net Payable Amount</h3>
              <p className="text-gray-600 text-sm">Total Earnings - Total Deductions</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${
                report.finalAmount === 0 ? 'text-green-600' :
                report.finalAmount > 0 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {formatBalance(report.finalAmount)}
              </div>
              <p className={`text-xs font-medium mt-1 ${
                report.finalAmount === 0 ? 'text-green-700' :
                report.finalAmount > 0 ? 'text-blue-700' : 'text-yellow-700'
              }`}>
                {report.finalAmount === 0 ? '✓ Fully Paid' :
                 report.finalAmount > 0 ? 'Balance Due to Employee' : 'Overpaid - Adjust in next month'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null;
  const monthlyReport = selectedEmployee ? generateMonthlyReport(selectedEmployee, selectedMonth) : null;

  // Show loading state
  if (salaryPaymentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Reports</h2>
            <p className="text-gray-600">Generate monthly payslip reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Database className="h-4 w-4" />
            Database Connected
          </div>
          
          {userRole === 'viewer' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              View Only
            </span>
          )}
        </div>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee & Month</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2 mt-2 text-sm">
              <input
                id="includeAllHistory"
                type="checkbox"
                checked={includeAllHistory}
                onChange={(e) => setIncludeAllHistory(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="includeAllHistory" className="text-gray-600">Include all history (show all-time totals)</label>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Employee
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => {
            const isSelected = selectedEmployee === employee.id;
            const report = generateMonthlyReport(employee.id, selectedMonth);

            return (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={employee.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">{employee.name}</span>
                    <p className="text-sm text-gray-600">{employee.designation}</p>
                  </div>
                </div>
                {report && (
                  <div className="text-xs text-gray-500">
                    {report.totalDaysWorked} days worked • {formatBalance(report.finalAmount)}
                    {report.additionalEarnings > 0 && (
                      <span className="text-blue-600 ml-1">(+{formatCurrency(report.additionalEarnings)} extra)</span>
                    )}
                    {report.totalSalaryPaid > 0 && (
                      <span className="text-green-600 ml-1">(Paid: {formatCurrency(report.totalSalaryPaid)})</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No employees found matching your search.</p>
          </div>
        )}
      </div>

      {/* Monthly Report */}
      {monthlyReport && selectedEmployeeData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Report - {selectedEmployeeData.name}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={downloadTextReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download TXT
              </button>
              <button
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Preview of PDF Content */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
            <h4 className="font-semibold text-gray-700 mb-3">Payslip Preview</h4>
            <PayslipPreview 
              employee={selectedEmployeeData} 
              report={monthlyReport} 
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-4">Detailed Breakdown</h4>
            
            {/* Attendance Details */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3">Attendance Details ({monthlyReport.attendanceDetails.length} records)</h5>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.attendanceDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.attendanceDetails.map((record) => (
                      <div key={record.id} className="p-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-IN')}
                          </span>
                          {record.customType && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {record.customType}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${
                            record.present ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {record.present ? 'Present' : 'Absent'}
                          </span>
                          {record.customAmount && (
                            <div className="text-sm text-blue-600">
                              +{formatCurrency(record.customAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No attendance records for this month
                  </div>
                )}
              </div>
            </div>

            {/* Advance Details */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3">Advance Details ({monthlyReport.advanceDetails.length} records)</h5>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.advanceDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.advanceDetails.map((advance) => (
                      <div key={advance.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {new Date(advance.date).toLocaleDateString('en-IN')}
                            </span>
                            <p className="text-sm text-gray-600">{advance.description}</p>
                          </div>
                          <span className="font-medium text-orange-600">
                            -{formatCurrency(advance.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No advances taken this month
                  </div>
                )}
              </div>
            </div>

            {/* Salary Payment Details */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Salary Payments ({monthlyReport.salaryPaymentDetails.length} records)</h5>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.salaryPaymentDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.salaryPaymentDetails.map((payment) => (
                      <div key={payment.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                            </span>
                            <p className="text-sm text-gray-600">{payment.description}</p>
                          </div>
                          <span className="font-medium text-green-600">
                            -{formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No salary payments this month
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManager;