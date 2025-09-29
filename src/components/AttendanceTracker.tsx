import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { getCurrentWeek, formatDate } from '../utils/dateUtils';
import { Calendar, Check, X, Users, Clock, DollarSign, Sun, Clock4 } from 'lucide-react';

interface AttendanceTrackerProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  userRole: 'admin' | 'viewer';
  onMarkAttendance: (employeeId: string, date: string, present: boolean) => void;
  onMarkLate: (employeeId: string, date: string) => void;
  onMarkCustom: (employeeId: string, date: string, type: 'ot' | 'half-day' | 'custom', amount?: number, otHours?: number, otRate?: number) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  employees,
  attendance,
  userRole,
  onMarkAttendance,
  onMarkLate,
  onMarkCustom,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAmount, setCustomAmount] = useState<{ [key: string]: string }>({});
  const [showCustomInput, setShowCustomInput] = useState<{ [key: string]: boolean }>({});
  const [otHours, setOtHours] = useState<{ [key: string]: string }>({});
  const [showOtInput, setShowOtInput] = useState<{ [key: string]: boolean }>({});
  const currentWeek = getCurrentWeek();

  const getAttendanceForDate = (employeeId: string, date: string) => {
    return attendance.find(a => a.employeeId === employeeId && a.date === date);
  };

  const getDaysOfWeek = () => {
    const days = [];
    const startDate = new Date(currentWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const daysOfWeek = getDaysOfWeek();
  const today = new Date().toISOString().split('T')[0];

  const isDateDisabled = (date: string) => {
    // Only allow today's date
    return date !== today;
  };

  const calculateEmployeeBalance = (employeeId: string) => {
    const currentWeek = getCurrentWeek();
    
    // Calculate total wages for current week including custom amounts
    const weekRecords = attendance.filter(a => 
      a.employeeId === employeeId && 
      a.weekStart === currentWeek
    );
    
    const employee = employees.find(e => e.id === employeeId);
    let totalWages = 0;
    
    weekRecords.forEach(record => {
      if (record.present) {
        totalWages += employee?.dailyWage || 0;
      }
      if (record.customAmount) {
        totalWages += record.customAmount;
      }
    });
    
    return totalWages;
  };

  const getWeekSummary = () => {
    const summary = employees.map(employee => {
      const weekRecords = attendance.filter(a => 
        a.employeeId === employee.id && 
        a.weekStart === currentWeek
      );
      
      const presentDays = weekRecords.filter(record => record.present).length;
      const otDays = weekRecords.filter(record => record.customType === 'ot').length;
      const halfDays = weekRecords.filter(record => record.customType === 'half-day').length;
      
      const baseEarnings = presentDays * employee.dailyWage;
      const customEarnings = weekRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0);
      const totalEarnings = baseEarnings + customEarnings;
      
      return {
        employee,
        presentDays,
        otDays,
        halfDays,
        totalEarnings
      };
    });
    
    return summary;
  };

  const handleCustomAmountChange = (employeeId: string, value: string) => {
    setCustomAmount(prev => ({
      ...prev,
      [employeeId]: value
    }));
  };

  const handleCustomPayment = (employeeId: string, date: string) => {
    const amount = parseFloat(customAmount[employeeId] || '0');
    if (amount > 0) {
      onMarkCustom(employeeId, date, 'custom', amount);
      setCustomAmount(prev => ({ ...prev, [employeeId]: '' }));
      setShowCustomInput(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleOtPayment = (employeeId: string, date: string) => {
    const hours = parseFloat(otHours[employeeId] || '0');
    const employee = employees.find(e => e.id === employeeId);
    if (hours > 0 && employee) {
      const otRate = employee.dailyWage / 8; // Assuming 8 hours per day
      const otAmount = hours * otRate * 1.5; // 1.5x rate for overtime
      onMarkCustom(employeeId, date, 'ot', otAmount, hours, otRate);
      setOtHours(prev => ({ ...prev, [employeeId]: '' }));
      setShowOtInput(prev => ({ ...prev, [employeeId]: false }));
    }
  };
  const getAttendanceStatus = (record: AttendanceRecord | undefined) => {
    if (!record) return 'not-marked';
    if (record.present && record.customType === 'ot') return 'ot';
    if (record.present && record.customType === 'half-day') return 'half-day';
    if (record.present && record.late) return 'late';
    if (record.present) return 'present';
    if (!record.present && record.late) return 'late-absent';
    return 'absent';
  };

  const weekSummary = getWeekSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          Week of {formatDate(currentWeek)}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">Add employees first to track their attendance.</p>
        </div>
      ) : (
        <>
          {/* Quick Date Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {userRole === 'admin' ? 'Mark Attendance for Today' : 'Today\'s Attendance'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => {
                const todayAttendance = getAttendanceForDate(employee.id, today);
                const status = getAttendanceStatus(todayAttendance);
                const balance = calculateEmployeeBalance(employee.id);
                const isTodayDisabled = isDateDisabled(today);
                
                return (
                  <div
                    key={employee.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.designation}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance >= 0 ? '+' : ''}₹{balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    
                    {userRole === 'admin' ? (
                      <div className="space-y-2">
                        {isTodayDisabled ? (
                          <div className="text-center py-2 text-gray-500 text-sm">
                            Future dates not allowed
                          </div>
                        ) : (
                          <>
                            {/* Basic Attendance Buttons */}
                            {status === 'not-marked' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onMarkAttendance(employee.id, today, true)}
                                  className="flex-1 p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center justify-center gap-1"
                                  title="Mark Present"
                                >
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm">Present</span>
                                </button>
                                <button
                                  onClick={() => onMarkAttendance(employee.id, today, false)}
                                  className="flex-1 p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-1"
                                  title="Mark Absent"
                                >
                                  <X className="h-4 w-4" />
                                  <span className="text-sm">Absent</span>
                                </button>
                              </div>
                            )}
                            
                            {/* Custom Options */}
                            {(status === 'present' || status === 'not-marked') && (
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => setShowOtInput(prev => ({ ...prev, [employee.id]: true }))}
                                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center gap-1"
                                  title="Overtime"
                                >
                                  <Clock4 className="h-4 w-4" />
                                  <span className="text-xs">OT</span>
                                </button>
                                <button
                                  onClick={() => onMarkCustom(employee.id, today, 'half-day')}
                                  className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200 flex items-center justify-center gap-1"
                                  title="Half Day"
                                >
                                  <Sun className="h-4 w-4" />
                                  <span className="text-xs">Half</span>
                                </button>
                                <button
                                  onClick={() => setShowCustomInput(prev => ({ ...prev, [employee.id]: true }))}
                                  className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 flex items-center justify-center gap-1"
                                  title="Custom Amount"
                                >
                                  <DollarSign className="h-4 w-4" />
                                  <span className="text-xs">Custom</span>
                                </button>
                              </div>
                            )}
                            
                            {/* OT Hours Input */}
                            {showOtInput[employee.id] && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={otHours[employee.id] || ''}
                                    onChange={(e) => setOtHours(prev => ({ ...prev, [employee.id]: e.target.value }))}
                                    placeholder="OT Hours"
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                    step="0.5"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => handleOtPayment(employee.id, today)}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowOtInput(prev => ({ ...prev, [employee.id]: false }))}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                {otHours[employee.id] && (
                                  <div className="text-xs text-blue-600 text-center">
                                    OT Amount: ₹{((parseFloat(otHours[employee.id]) || 0) * (employee.dailyWage / 8) * 1.5).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Custom Amount Input */}
                            {showCustomInput[employee.id] && (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={customAmount[employee.id] || ''}
                                  onChange={(e) => handleCustomAmountChange(employee.id, e.target.value)}
                                  placeholder="Amount"
                                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                  onClick={() => handleCustomPayment(employee.id, today)}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowCustomInput(prev => ({ ...prev, [employee.id]: false }))}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                            
                            {/* Status Display */}
                            {status !== 'not-marked' && (
                              <div className="flex justify-center">
                                {status === 'present' && (
                                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Present
                                  </div>
                                )}
                                {status === 'absent' && (
                                  <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    Absent
                                  </div>
                                )}
                                {status === 'late' && (
                                  <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Late
                                  </div>
                                )}
                                {status === 'ot' && (
                                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                                    <Clock4 className="h-3 w-3" />
                                    Overtime
                                  </div>
                                )}
                                {status === 'half-day' && (
                                  <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                                    <Sun className="h-3 w-3" />
                                    Half Day
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        {status === 'present' && (
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Present
                          </div>
                        )}
                        {status === 'absent' && (
                          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Absent
                          </div>
                        )}
                        {status === 'late' && (
                          <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Late
                          </div>
                        )}
                        {status === 'ot' && (
                          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                            <Clock4 className="h-3 w-3" />
                            Overtime
                          </div>
                        )}
                        {status === 'half-day' && (
                          <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                            <Sun className="h-3 w-3" />
                            Half Day
                          </div>
                        )}
                        {status === 'not-marked' && (
                          <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                            Not Marked
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Attendance Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Employee</th>
                    {daysOfWeek.map((date) => (
                      <th key={date} className="text-center py-3 px-2 font-medium text-gray-900 min-w-16">
                        <div className="text-xs text-gray-600">
                          {new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                        <div className="text-sm">
                          {new Date(date).toLocaleDateString('en-IN', { day: 'numeric' })}
                        </div>
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-600">{employee.designation}</div>
                        </div>
                      </td>
                      {daysOfWeek.map((date) => {
                        const record = getAttendanceForDate(employee.id, date);
                        const status = getAttendanceStatus(record);
                        const isDisabled = isDateDisabled(date);
                        const isToday = date === today;
                        
                        return (
                          <td key={date} className="py-3 px-2 text-center">
                            {!isDisabled && userRole === 'admin' ? (
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => onMarkAttendance(employee.id, date, true)}
                                    className={`p-1 rounded transition-colors duration-200 ${
                                      status === 'present' || status === 'late' || status === 'ot' || status === 'half-day'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-600'
                                    }`}
                                    title="Present"
                                    disabled={isDisabled}
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onMarkAttendance(employee.id, date, false)}
                                    className={`p-1 rounded transition-colors duration-200 ${
                                      status === 'absent' || status === 'late-absent'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600'
                                    }`}
                                    title="Absent"
                                    disabled={isDisabled}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                {isToday && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => onMarkCustom(employee.id, date, 'ot')}
                                      className={`p-1 rounded transition-colors duration-200 ${
                                        status === 'ot'
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                                      }`}
                                      title="Overtime"
                                    >
                                      <Clock4 className="h-2 w-2" />
                                    </button>
                                    <button
                                      onClick={() => onMarkCustom(employee.id, date, 'half-day')}
                                      className={`p-1 rounded transition-colors duration-200 ${
                                        status === 'half-day'
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-gray-200 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                                      }`}
                                      title="Half Day"
                                    >
                                      <Sun className="h-2 w-2" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                {status === 'present' && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {status === 'absent' && (
                                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <X className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {status === 'late' && (
                                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <Clock className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {status === 'ot' && (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Clock4 className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {status === 'half-day' && (
                                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Sun className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {status === 'not-marked' && (
                                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                                )}
                                {isDisabled && userRole === 'admin' && (
                                  <div className="text-xs text-gray-400">
                                    {date > today ? 'Future' : 'Past'}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center">
                        <div className="font-semibold text-gray-900">
                          {daysOfWeek.filter(date => {
                            const record = getAttendanceForDate(employee.id, date);
                            return record?.present;
                          }).length}/7
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Week Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Week Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekSummary.map(({ employee, presentDays, otDays, halfDays, totalEarnings }) => (
                <div key={employee.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Present:</span>
                      <span className="font-medium">{presentDays}/7</span>
                    </div>
                    {otDays > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">OT Days:</span>
                        <span className="font-medium text-blue-600">{otDays}</span>
                      </div>
                    )}
                    {halfDays > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Half Days:</span>
                        <span className="font-medium text-orange-600">{halfDays}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="font-medium text-green-600">
                        ₹{totalEarnings.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceTracker;