import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Employee, AttendanceRecord, Advance, Vehicle, FuelRecord } from './types';
import { useFirestore } from './hooks/useFirestore';
import { getCurrentWeek } from './utils/dateUtils';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceTracker from './components/AttendanceTracker';
import AdvanceManager from './components/AdvanceManager';
import PaymentManager from './components/PaymentManager';
import ReportManager from './components/ReportManager';
import VehicleManager from './components/VehicleManager';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  IndianRupee, 
  CreditCard,
  FileText,
  Truck,
  Menu, 
  X,
  Building2,
  LogOut
} from 'lucide-react';

function App() {
  const [user, setUser] = useLocalStorage<{ role: 'admin' | 'viewer' } | null>('khata-user', null);
  
  // Firebase hooks
  const { data: employees, loading: employeesLoading, addItem: addEmployee, deleteItem: deleteEmployee } = useFirestore<Employee>('employees');
  const { data: attendance, loading: attendanceLoading, addItem: addAttendanceRecord, updateItem: updateAttendanceRecord } = useFirestore<AttendanceRecord>('attendance');
  const { data: advances, loading: advancesLoading, addItem: addAdvanceRecord, deleteItem: deleteAdvance } = useFirestore<Advance>('advances');
  const { data: vehicles, loading: vehiclesLoading, addItem: addVehicle } = useFirestore<Vehicle>('vehicles');
  const { data: fuelRecords, loading: fuelRecordsLoading, addItem: addFuelRecord, deleteItem: deleteFuelRecord } = useFirestore<FuelRecord>('fuelRecords');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (role: 'admin' | 'viewer') => {
    setUser({ role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If your useFirestore.addItem requires createdAt (Omit<T,'id'>),
  // we add createdAt here to satisfy the type. If not needed in your hook,
  // the extra field will be ignored by Firestore if your backend doesn't store it.
  const handleAddEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    if (user?.role !== 'admin') return;
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      createdAt: new Date().toISOString(),
    };
    return addEmployee(newEmployee);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (user?.role !== 'admin') return;
    deleteEmployee(employeeId);
  };

  const handleMarkAttendance = (employeeId: string, date: string, present: boolean) => {
    if (user?.role !== 'admin') return;
    const weekStart = getCurrentWeek();
    const existingRecord = attendance.find(
      a => a.employeeId === employeeId && a.date === date
    );

    if (existingRecord && existingRecord.id) {
      // safe: existingRecord.id is string
      updateAttendanceRecord(existingRecord.id, { present, late: false });
    } else {
      // use Omit so we don't require id when creating
      const newRecord: Omit<AttendanceRecord, 'id'> = {
        employeeId,
        date,
        present,
        late: false,
        weekStart,
      };
      addAttendanceRecord(newRecord);
    }
  };

  const handleMarkLate = (employeeId: string, date: string) => {
    if (user?.role !== 'admin') return;
    const existingRecord = attendance.find(
      a => a.employeeId === employeeId && a.date === date
    );
    
    if (existingRecord && existingRecord.id) {
      updateAttendanceRecord(existingRecord.id, { present: true, late: true });
    }
  };

  const handleMarkCustom = (employeeId: string, date: string, customType: "ot" | "half-day" | "custom", customAmount?: number) => {
    if (user?.role !== 'admin') return;
    const weekStart = getCurrentWeek();
    const existingRecord = attendance.find(
      a => a.employeeId === employeeId && a.date === date
    );

    if (existingRecord && existingRecord.id) {
      updateAttendanceRecord(existingRecord.id, { 
        present: true, 
        late: false, 
        customType, 
        customAmount 
      });
    } else {
      const newRecord: Omit<AttendanceRecord, 'id'> = {
        employeeId,
        date,
        present: true,
        late: false,
        weekStart,
        customType,
        customAmount,
      };
      addAttendanceRecord(newRecord);
    }
  };

  const handleAddAdvance = (advanceData: Omit<Advance, 'id'>) => {
    if (user?.role !== 'admin') return;
    addAdvanceRecord(advanceData);
  };

  const handleDeleteAdvance = (advanceId: string) => {
    if (user?.role !== 'admin') return;
    deleteAdvance(advanceId);
  };

  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    if (user?.role !== 'admin') return;
    const newVehicle: Omit<Vehicle, 'id'> = {
      ...vehicleData,
      createdAt: new Date().toISOString(),
    };
    addVehicle(newVehicle);
  };

  const handleAddFuelRecord = (fuelData: Omit<FuelRecord, 'id' | 'createdAt'>) => {
    if (user?.role !== 'admin') return;
    const newFuel: Omit<FuelRecord, 'id'> = {
      ...fuelData,
      createdAt: new Date().toISOString(),
    };
    addFuelRecord(newFuel);
  };

  const handleDeleteFuelRecord = (fuelRecordId: string) => {
    if (user?.role !== 'admin') return;
    deleteFuelRecord(fuelRecordId);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'advances', label: 'Advances', icon: IndianRupee },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            employees={employees} 
            attendance={attendance} 
            advances={advances} 
          />
        );
      case 'employees':
        return (
          <EmployeeManagement
            employees={employees}
            attendance={attendance}
            advances={advances}
            userRole={user?.role || 'viewer'}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case 'attendance':
        return (
          <AttendanceTracker
            employees={employees}
            attendance={attendance}
            userRole={user?.role || 'viewer'}
            onMarkAttendance={handleMarkAttendance}
            onMarkLate={handleMarkLate}
            onMarkCustom={handleMarkCustom}
          />
        );
      case 'advances':
        return (
          <AdvanceManager
            employees={employees}
            advances={advances}
            userRole={user?.role || 'viewer'}
            onAddAdvance={handleAddAdvance}
            onDeleteAdvance={handleDeleteAdvance}
          />
        );
      case 'payments':
        return (
          <PaymentManager
            employees={employees}
            attendance={attendance}
            advances={advances}
            userRole={user?.role || 'viewer'}
          />
        );
      case 'reports':
        return (
          <ReportManager
            employees={employees}
            attendance={attendance}
            advances={advances}
            userRole={user?.role || 'viewer'}
          />
        );
      case 'vehicles':
        return (
          <VehicleManager
            vehicles={vehicles}
            fuelRecords={fuelRecords}
            userRole={user?.role || 'viewer'}
            onAddVehicle={handleAddVehicle}
            onAddFuelRecord={handleAddFuelRecord}
            onDeleteFuelRecord={handleDeleteFuelRecord}
          />
        );
      default:
        return null;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Show loading state while data is being fetched
  if (employeesLoading || attendanceLoading || advancesLoading || vehiclesLoading || fuelRecordsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${user.role === 'admin' ? 'bg-blue-600' : 'bg-green-600'}`}>
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pramod Construction & Engineering</h1>
              <p className="text-xs text-gray-600">
                {user.role === 'admin' ? 'Admin Panel' : 'Viewer Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === item.id
                        ? `${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} font-medium`
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {user.role === 'viewer' && item.id !== 'dashboard' && (
                      <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        View Only
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Workers</span>
              <span className="font-medium text-gray-900">{employees.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">This Week Advances</span>
              <span className="font-medium text-orange-600">
                ₹{advances
                  .filter(a => {
                    const advanceDate = new Date(a.date);
                    const weekStart = new Date(getCurrentWeek());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return advanceDate >= weekStart && advanceDate <= weekEnd;
                  })
                  .reduce((sum, a) => sum + a.amount, 0)
                  .toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className={`text-xs px-2 py-1 rounded-full ${
              user.role === 'admin' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {user.role === 'admin' ? 'Admin' : 'Viewer'}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Pramod Construction & Engineering</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
