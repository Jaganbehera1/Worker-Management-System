import React, { useState } from 'react';
import { Employee, AttendanceRecord, Advance } from '../types';
import { formatCurrency, getCurrentWeek, getWeekStart } from '../utils/dateUtils';
import { Plus, CreditCard as Edit2, Phone, Calendar, IndianRupee, User, X, Trash2 } from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  advances: Advance[];
  userRole: 'admin' | 'viewer';
  onAddEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  attendance,
  advances,
  userRole,
  onAddEmployee,
  onDeleteEmployee,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    contactNumber: '',
    dailyWage: 500,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 500KB to avoid Firestore document size limits)
      if (file.size > 500 * 1024) {
        alert('Photo size should be less than 500KB. Please choose a smaller image.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Photo preview:', photoPreview ? 'Photo selected' : 'No photo');
    
    try {
      console.log('Adding employee with data:', { ...formData, photo: photoPreview });
      await onAddEmployee({
        ...formData,
        photo: photoPreview
      });
      
      console.log('Employee added successfully');
      
      // Reset form
      setFormData({ name: '', designation: '', contactNumber: '', dailyWage: 500 });
      setPhotoPreview('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee. Please try again.');
    }
  };

  // Simple function to get daily wage for an employee
  const getEmployeeDailyWage = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.dailyWage || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Add Employee Form */}
      {showAddForm && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-auto p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mt-10 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter employee name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mason, Helper, Electrician"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Wage (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.dailyWage}
                  onChange={(e) => setFormData({ ...formData, dailyWage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Photo (Optional - Max 500KB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Choose images smaller than 500KB for best performance</p>
                {photoPreview && (
                  <div className="mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Add Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              {selectedEmployee.photo ? (
                <img
                  src={selectedEmployee.photo}
                  alt={selectedEmployee.name}
                  className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-gray-200 mb-4"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
              <p className="text-gray-600">{selectedEmployee.designation}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{selectedEmployee.contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Wage:</span>
                <span className="font-medium">{formatCurrency(selectedEmployee.dailyWage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined:</span>
                <span className="font-medium">
                  {new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
            
            {userRole === 'admin' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedEmployee.name}?`)) {
                      onDeleteEmployee(selectedEmployee.id);
                      setSelectedEmployee(null);
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Employee
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((employee) => {
          const dailyWage = getEmployeeDailyWage(employee.id);
          
          return (
            <div
              key={employee.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="text-center">
                <div className="mb-3">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={employee.name}
                      className="w-16 h-16 object-cover rounded-full mx-auto border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-center">{employee.name}</h3>
                <p className="text-sm text-gray-600 text-center mb-3">{employee.designation}</p>
                
                <div className="text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {formatCurrency(dailyWage)}/day
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {employees.length === 0 && (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first employee to the system.</p>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Add First Employee
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;