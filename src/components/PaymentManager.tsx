import React, { useState } from 'react';
import { Employee, AttendanceRecord, Advance, SalaryPayment } from '../types';
import { formatCurrency, getCurrentWeek, getWeekStart } from '../utils/dateUtils';
import { CreditCard, User, Calendar, IndianRupee, TrendingUp, TrendingDown, Search, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

interface PaymentManagerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  advances: Advance[];
  userRole: 'admin' | 'viewer';
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
  employees,
  attendance,
  advances,
  userRole,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [paymentDescription, setPaymentDescription] = useState<string>('Salary Payment');
  const [includeAllHistory, setIncludeAllHistory] = useState<boolean>(false);
  
  // Use Firestore for salary payments
  const { data: salaryPayments, addItem: addSalaryPayment, loading: salaryPaymentsLoading } = useFirestore<SalaryPayment>('salaryPayments');

  const calculateEmployeePayment = (employeeId: string) => {
    const currentWeek = getCurrentWeek();
    const employee = employees.find(e => e.id === employeeId);

    if (!employee) return null;

    // Get all attendance records for the current week
    const weekRecords = attendance.filter(a => 
      a.employeeId === employeeId && 
      a.weekStart === currentWeek
    );
    
    // Calculate total wages including OT and custom amounts
    let totalWages = 0;
    let baseWages = 0;
    let additionalEarnings = 0;
    let daysWorked = 0;

    weekRecords.forEach(record => {
      if (record.present) {
        // Base daily wage
        const baseWage = employee.dailyWage;
        baseWages += baseWage;
        daysWorked++;
      }
      
      // Add custom amount (for OT, half-day, or custom payments)
      if (record.customAmount) {
        additionalEarnings += record.customAmount;
      }
    });

    totalWages = baseWages + additionalEarnings;
    
    // By default we scope advances / payments to the current week to avoid
    // surprising global balance shifts when older payments/advances exist.
    // Admin can toggle `includeAllHistory` to view global balances.
    const weekAdvancesTotal = advances
      .filter(a => a.employeeId === employeeId && getWeekStart(new Date(a.date)) === currentWeek)
      .reduce((sum, a) => sum + a.amount, 0);

    const weekSalaryPaymentsTotal = salaryPayments
      .filter(p => p.employeeId === employeeId && getWeekStart(new Date(p.paymentDate)) === currentWeek)
      .reduce((sum, p) => sum + p.amount, 0);

    // If includeAllHistory is true, aggregate across entire history instead.
    const allAdvancesTotal = advances
      .filter(a => a.employeeId === employeeId)
      .reduce((sum, a) => sum + a.amount, 0);

    const allSalaryPaymentsTotal = salaryPayments
      .filter(p => p.employeeId === employeeId)
      .reduce((sum, p) => sum + p.amount, 0);

    const advancesTotal = includeAllHistory ? allAdvancesTotal : weekAdvancesTotal;
    const salaryPaymentsTotal = includeAllHistory ? allSalaryPaymentsTotal : weekSalaryPaymentsTotal;

    // Final payment = Total wages - advances (in selected scope)
    const finalPayment = totalWages - advancesTotal;

    // Remaining balance = Final payment - salary payments (in selected scope)
    const remainingBalance = finalPayment - salaryPaymentsTotal;
    
    // Get OT and custom details (for current week only)
    const otRecords = weekRecords.filter(record => record.customType === 'ot');
    const halfDayRecords = weekRecords.filter(record => record.customType === 'half-day');
    const customPaymentRecords = weekRecords.filter(record => record.customType === 'custom');
    
    return {
      employee,
      daysWorked,
      baseWages,
      additionalEarnings,
      totalWages,
      weekAdvances: weekAdvancesTotal,
      finalPayment,
      weekSalaryPayments: weekSalaryPaymentsTotal,
      remainingBalance,
      advances: advances.filter(a => a.employeeId === employeeId), // all advance entries (for list)
      salaryPayments: salaryPayments.filter(p => p.employeeId === employeeId), // all payments (for history)
      otRecords,
      halfDayRecords,
      customPaymentRecords,
      weekRecords
    };
  };

  const handleSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (userRole !== 'admin') {
      alert('Only admin users can record payments');
      return;
    }

    const paymentData: Omit<SalaryPayment, 'id' | 'createdAt'> = {
      employeeId: selectedEmployee,
      amount: parseFloat(paymentAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      description: paymentDescription,
      weekStart: getCurrentWeek(), // Keep this for reporting, but don't use for filtering
    };

    try {
      await addSalaryPayment(paymentData);
      
      // Reset form
      setPaymentAmount('');
      setPaymentDescription('Salary Payment');
      setShowPaymentForm(false);
      
      alert('Payment recorded successfully! This payment will be permanently tracked.');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  // Helper function to format balance with correct signs
  const formatBalance = (balance: number) => {
    if (balance === 0) return formatCurrency(0);
    if (balance > 0) return `+${formatCurrency(balance)}`; // Employee is owed money
    return `+${formatCurrency(Math.abs(balance))}`; // Company is owed money (overpaid)
  };

  // Helper function to get balance display info
  const getBalanceDisplayInfo = (balance: number) => {
    if (balance === 0) {
      return { text: '✓ Paid', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    } else if (balance > 0) {
      return { text: `${formatCurrency(balance)} due`, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    } else {
      // Overpaid - company is owed money
      return { text: `+${formatCurrency(Math.abs(balance))} overpaid`, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = selectedEmployee ? calculateEmployeePayment(selectedEmployee) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
            <p className="text-gray-600">Calculate final payments and record salary payments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Database Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Database className="h-4 w-4" />
            Database Connected
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center text-sm text-gray-600 gap-2">
              <input
                type="checkbox"
                checked={includeAllHistory}
                onChange={(e) => setIncludeAllHistory(e.target.checked)}
                className="accent-indigo-600"
              />
              Include all history in balance
            </label>

            {userRole === 'viewer' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                View Only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee for Payment</h3>
        
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee by name or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => {
            const paymentData = calculateEmployeePayment(employee.id);
            if (!paymentData) return null;

            const isSelected = selectedEmployee === employee.id;
            const balanceInfo = getBalanceDisplayInfo(paymentData.remainingBalance);

            return (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : `border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 ${balanceInfo.borderColor} ${balanceInfo.bgColor}`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{employee.name}</span>
                  </div>
                  <div className={`text-sm font-semibold ${balanceInfo.color}`}>
                    {balanceInfo.text}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{employee.designation}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {paymentData.daysWorked} days + {paymentData.additionalEarnings > 0 ? formatCurrency(paymentData.additionalEarnings) + ' extra' : 'no extras'}
                </div>
                {paymentData.weekSalaryPayments > 0 && (
                  <div className="mt-1 text-xs text-green-600">
                    Paid: {formatCurrency(paymentData.weekSalaryPayments)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </div>
        )}
        
        {employees.length === 0 && !searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No employees found. Add employees first to calculate payments.</p>
          </div>
        )}
      </div>

      {/* Payment Details */}
      {selectedEmployeeData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Details - {selectedEmployeeData.employee.name}
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Week of {new Date(getCurrentWeek()).toLocaleDateString('en-IN', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              
              {/* Record Payment Button - Now it will always show for admin */}
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  disabled={salaryPaymentsLoading}
                >
                  <CreditCard className="h-4 w-4" />
                  Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Payment Status Banner */}
          {selectedEmployeeData.remainingBalance === 0 ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Fully Paid</h4>
                  <p className="text-green-700 text-sm">
                    This employee has been fully paid for this week. Total payment: {formatCurrency(selectedEmployeeData.weekSalaryPayments)}
                  </p>
                </div>
              </div>
            </div>
          ) : selectedEmployeeData.remainingBalance < 0 ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Overpaid</h4>
                  <p className="text-yellow-700 text-sm">
                    This employee has been overpaid by {formatCurrency(Math.abs(selectedEmployeeData.remainingBalance))}. 
                    The company is owed this amount.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Salary Payment Form */}
          {showPaymentForm && userRole === 'admin' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Record Salary Payment</h4>
              <form onSubmit={handleSalaryPayment} className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      className="accent-indigo-600"
                    />
                    Payments do not auto-settle advances. To apply payments to advances, review history manually.
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                      disabled={salaryPaymentsLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                      placeholder="Payment description"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={salaryPaymentsLoading}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={salaryPaymentsLoading}
                    >
                      {salaryPaymentsLoading ? 'Processing...' : 'Submit Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors disabled:bg-gray-200"
                      disabled={salaryPaymentsLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {paymentAmount && (
                  <div className="text-sm text-blue-700">
                    Remaining balance after this payment: {formatBalance(selectedEmployeeData.remainingBalance - parseFloat(paymentAmount))}
                  </div>
                )}
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Payment will be saved to database
                </div>
              </form>
            </div>
          )}

          {/* Earnings Breakdown */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Payment Calculation</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Wages ({selectedEmployeeData.daysWorked} days × {formatCurrency(selectedEmployeeData.employee.dailyWage)})</span>
                <span className="font-medium text-green-600">+{formatCurrency(selectedEmployeeData.baseWages)}</span>
              </div>
              
              {selectedEmployeeData.additionalEarnings > 0 && (
                <>
                  {selectedEmployeeData.otRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Overtime ({selectedEmployeeData.otRecords.length} days)</span>
                      <span className="font-medium text-blue-600">
                        +{formatCurrency(selectedEmployeeData.otRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  {selectedEmployeeData.halfDayRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Half Days ({selectedEmployeeData.halfDayRecords.length} days)</span>
                      <span className="font-medium text-orange-600">
                        +{formatCurrency(selectedEmployeeData.halfDayRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  {selectedEmployeeData.customPaymentRecords.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custom Payments ({selectedEmployeeData.customPaymentRecords.length})</span>
                      <span className="font-medium text-purple-600">
                        +{formatCurrency(selectedEmployeeData.customPaymentRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Additional Earnings Total</span>
                    <span className="font-medium text-blue-600">+{formatCurrency(selectedEmployeeData.additionalEarnings)}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
                <span className="text-gray-900">Total Earnings</span>
                <span className="text-green-600">+{formatCurrency(selectedEmployeeData.totalWages)}</span>
              </div>

              {/* Deductions */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Advances Taken</span>
                <span className="font-medium text-orange-600">-{formatCurrency(selectedEmployeeData.weekAdvances)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
                <span className="text-gray-900">Net Payable</span>
                <span className="text-green-600">+{formatCurrency(selectedEmployeeData.finalPayment)}</span>
              </div>

              {/* Salary Payments */}
              {selectedEmployeeData.weekSalaryPayments > 0 && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Salary Paid</span>
                    <span className="font-medium text-green-600">-{formatCurrency(selectedEmployeeData.weekSalaryPayments)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-lg">
                    <span className="text-gray-900">Remaining Balance</span>
                    <span className={`${
                      selectedEmployeeData.remainingBalance === 0 ? 'text-green-600' :
                      selectedEmployeeData.remainingBalance > 0 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {formatBalance(selectedEmployeeData.remainingBalance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Current Week Wages</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(selectedEmployeeData.totalWages)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedEmployeeData.daysWorked} days worked
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Advances</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(selectedEmployeeData.weekAdvances)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedEmployeeData.advances.length} advance(s) total
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Salary Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(selectedEmployeeData.weekSalaryPayments)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {selectedEmployeeData.salaryPayments.length} payment(s) total
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className={`rounded-lg p-4 ${
              selectedEmployeeData.remainingBalance === 0 ? 'bg-green-50' :
              selectedEmployeeData.remainingBalance > 0 ? 'bg-blue-50' : 'bg-yellow-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    selectedEmployeeData.remainingBalance === 0 ? 'text-green-600' :
                    selectedEmployeeData.remainingBalance > 0 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {selectedEmployeeData.remainingBalance === 0 ? 'Fully Paid' :
                     selectedEmployeeData.remainingBalance > 0 ? 'Balance Due' : 'Overpaid'}
                  </p>
                  <p className={`text-2xl font-bold ${
                    selectedEmployeeData.remainingBalance === 0 ? 'text-green-900' :
                    selectedEmployeeData.remainingBalance > 0 ? 'text-blue-900' : 'text-yellow-900'
                  }`}>
                    {formatBalance(selectedEmployeeData.remainingBalance)}
                  </p>
                </div>
                <IndianRupee className={`h-8 w-8 ${
                  selectedEmployeeData.remainingBalance === 0 ? 'text-green-600' :
                  selectedEmployeeData.remainingBalance > 0 ? 'text-blue-600' : 'text-yellow-600'
                }`} />
              </div>
            </div>
          </div>

          {/* Payment History */}
          {selectedEmployeeData.salaryPayments.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-4">All Payment History</h4>
              <div className="space-y-3">
                {selectedEmployeeData.salaryPayments
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{payment.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="font-semibold text-green-600">
                        -{formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Advance Details */}
          {selectedEmployeeData.advances.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Advance Details This Week</h4>
              <div className="space-y-3">
                {selectedEmployeeData.advances.map((advance) => (
                  <div key={advance.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{advance.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(advance.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className="font-semibold text-orange-600">
                      -{formatCurrency(advance.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Employees Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Employees Payment Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Employee</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Days</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Total Wages</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Advances</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Salary Paid</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Balance</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const paymentData = calculateEmployeePayment(employee.id);
                if (!paymentData) return null;

                const status = paymentData.remainingBalance === 0 ? 'paid' : 
                              paymentData.remainingBalance > 0 ? 'pending' : 'overpaid';

                return (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.designation}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{paymentData.daysWorked}/7</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-green-600">
                        {formatCurrency(paymentData.totalWages)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-orange-600">
                        {formatCurrency(paymentData.weekAdvances)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-green-600">
                        {formatCurrency(paymentData.weekSalaryPayments)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${
                        status === 'paid' ? 'text-green-600' :
                        status === 'pending' ? 'text-blue-600' : 'text-yellow-600'
                      }`}>
                        {formatBalance(paymentData.remainingBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'paid' ? 'bg-green-100 text-green-800' :
                        status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overpaid'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No employees found to calculate payments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManager;