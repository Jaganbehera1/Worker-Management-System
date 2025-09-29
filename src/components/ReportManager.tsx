import React, { useState } from 'react';
import { Employee, AttendanceRecord, Advance, MonthlyReport, SalaryPayment } from '../types';
import { formatCurrency, getWeekStart } from '../utils/dateUtils';
import { FileText, Download, Calendar, User, IndianRupee, Clock, TrendingUp, TrendingDown, Search, Database } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

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
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Use Firestore for salary payments
  const { data: salaryPayments, loading: salaryPaymentsLoading } = useFirestore<SalaryPayment>('salaryPayments');

  const generateMonthlyReport = (employeeId: string, month: string): MonthlyReport | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    // Get attendance records for the month
    const monthAttendance = attendance.filter(a => {
      const attendanceDate = new Date(a.date);
      return a.employeeId === employeeId && 
             attendanceDate >= monthStart && 
             attendanceDate <= monthEnd;
    });

    // Get advance records for the month
    const monthAdvances = advances.filter(a => {
      const advanceDate = new Date(a.date);
      return a.employeeId === employeeId && 
             advanceDate >= monthStart && 
             advanceDate <= monthEnd;
    });

    // Get salary payment records for the month
    const monthSalaryPayments = salaryPayments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return p.employeeId === employeeId && 
             paymentDate >= monthStart && 
             paymentDate <= monthEnd;
    });

    // Calculate totals with proper breakdown
    const totalDaysWorked = monthAttendance.filter(a => a.present).length;
    
    let baseWages = 0;
    let additionalEarnings = 0;
    let totalWagesEarned = 0;

    monthAttendance.forEach(record => {
      if (record.present) {
        // Base daily wage
        baseWages += employee.dailyWage;
      }
      
      // Add custom amount (for OT, half-day, or custom payments)
      if (record.customAmount) {
        additionalEarnings += record.customAmount;
      }
    });

    totalWagesEarned = baseWages + additionalEarnings;

    const totalAdvancesTaken = monthAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalSalaryPaid = monthSalaryPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Final amount calculation: Total wages - Advances - Salary already paid
    const finalAmount = totalWagesEarned - totalAdvancesTaken - totalSalaryPaid;

    // Get detailed breakdown of additional earnings
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

  // Helper function to format balance with correct signs
  const formatBalance = (balance: number) => {
    if (balance === 0) return formatCurrency(0);
    if (balance > 0) return `+${formatCurrency(balance)}`; // Employee is owed money
    return `+${formatCurrency(Math.abs(balance))}`; // Company is owed money (overpaid)
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null;
  const monthlyReport = selectedEmployee ? generateMonthlyReport(selectedEmployee, selectedMonth) : null;

  const downloadReport = () => {
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

ATTENDANCE DETAILS:
${monthlyReport.attendanceDetails.map(a => 
  `${new Date(a.date).toLocaleDateString('en-IN')}: ${a.present ? 'Present' : 'Absent'}${a.customType ? ` (${a.customType})` : ''}${a.customAmount ? ` +${formatCurrency(a.customAmount)}` : ''}`
).join('\n')}

ADVANCE DETAILS:
${monthlyReport.advanceDetails.map(a => 
  `${new Date(a.date).toLocaleDateString('en-IN')}: ${formatCurrency(a.amount)} - ${a.description}`
).join('\n')}

SALARY PAYMENT DETAILS:
${monthlyReport.salaryPaymentDetails.map(p => 
  `${new Date(p.paymentDate).toLocaleDateString('en-IN')}: ${formatCurrency(p.amount)} - ${p.description}`
).join('\n')}

Generated on: ${new Date().toLocaleDateString('en-IN')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEmployeeData.name}_${selectedMonth}_payslip.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          {/* Database Status Indicator */}
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
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {selectedEmployeeData.photo ? (
                <img
                  src={selectedEmployeeData.photo}
                  alt={selectedEmployeeData.name}
                  className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-indigo-600" />
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedEmployeeData.name}</h4>
                <p className="text-gray-600">{selectedEmployeeData.designation}</p>
                <p className="text-sm text-gray-500">Daily Wage: {formatCurrency(selectedEmployeeData.dailyWage)}</p>
              </div>
            </div>
            <div className="text-center">
              <h5 className="text-lg font-semibold text-gray-900">
                Report for {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h5>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Payment Calculation</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Wages ({monthlyReport.totalDaysWorked} days × {formatCurrency(selectedEmployeeData.dailyWage)})</span>
                <span className="font-medium text-green-600">+{formatCurrency(monthlyReport.baseWages)}</span>
              </div>
              
              {monthlyReport.additionalEarnings > 0 && (
                <>
                  {monthlyReport.otRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Overtime ({monthlyReport.otRecords.length} days)</span>
                      <span className="font-medium text-blue-600">
                        +{formatCurrency(monthlyReport.otRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  {monthlyReport.halfDayRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Half Days ({monthlyReport.halfDayRecords.length} days)</span>
                      <span className="font-medium text-orange-600">
                        +{formatCurrency(monthlyReport.halfDayRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  {monthlyReport.customPaymentRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custom Payments ({monthlyReport.customPaymentRecords.length})</span>
                      <span className="font-medium text-purple-600">
                        +{formatCurrency(monthlyReport.customPaymentRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Additional Earnings Total</span>
                    <span className="font-medium text-blue-600">+{formatCurrency(monthlyReport.additionalEarnings)}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
                <span className="text-gray-900">Total Earnings</span>
                <span className="text-green-600">+{formatCurrency(monthlyReport.totalWagesEarned)}</span>
              </div>

              {/* Deductions */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Advances Taken</span>
                <span className="font-medium text-orange-600">-{formatCurrency(monthlyReport.totalAdvancesTaken)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Salary Paid</span>
                <span className="font-medium text-green-600">-{formatCurrency(monthlyReport.totalSalaryPaid)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-lg">
                <span className="text-gray-900">Final Amount</span>
                <span className={`${
                  monthlyReport.finalAmount === 0 ? 'text-green-600' :
                  monthlyReport.finalAmount > 0 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {formatBalance(monthlyReport.finalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Days Worked</p>
                  <p className="text-2xl font-bold text-blue-900">{monthlyReport.totalDaysWorked}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Wages</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(monthlyReport.totalWagesEarned)}
                  </p>
                  {monthlyReport.additionalEarnings > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      +{formatCurrency(monthlyReport.additionalEarnings)} extra
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Advances Taken</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(monthlyReport.totalAdvancesTaken)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className={`rounded-lg p-4 ${
              monthlyReport.finalAmount === 0 ? 'bg-green-50' :
              monthlyReport.finalAmount > 0 ? 'bg-blue-50' : 'bg-yellow-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    monthlyReport.finalAmount === 0 ? 'text-green-600' :
                    monthlyReport.finalAmount > 0 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {monthlyReport.finalAmount === 0 ? 'Fully Paid' :
                     monthlyReport.finalAmount > 0 ? 'Balance Due' : 'Overpaid'}
                  </p>
                  <p className={`text-2xl font-bold ${
                    monthlyReport.finalAmount === 0 ? 'text-green-900' :
                    monthlyReport.finalAmount > 0 ? 'text-blue-900' : 'text-yellow-900'
                  }`}>
                    {formatBalance(monthlyReport.finalAmount)}
                  </p>
                </div>
                <IndianRupee className={`h-8 w-8 ${
                  monthlyReport.finalAmount === 0 ? 'text-green-600' :
                  monthlyReport.finalAmount > 0 ? 'text-blue-600' : 'text-yellow-600'
                }`} />
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Attendance Details</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.attendanceDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.attendanceDetails.map((record) => (
                      <div key={record.id} className="p-3 flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
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
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Advance Details</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.advanceDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.advanceDetails.map((advance) => (
                      <div key={advance.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {new Date(advance.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
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
              <h4 className="font-medium text-gray-900 mb-3">Salary Payments</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {monthlyReport.salaryPaymentDetails.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {monthlyReport.salaryPaymentDetails.map((payment) => (
                      <div key={payment.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
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