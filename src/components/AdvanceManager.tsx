import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import { Employee, Advance } from '../types';

interface AdvanceManagerProps {
  employees: Employee[];
  advances: Advance[];
  userRole: 'admin' | 'viewer';
  onAddAdvance: (advance: Omit<Advance, 'id'>) => void;
  onDeleteAdvance: (id: string) => void;
}

const AdvanceManager: React.FC<AdvanceManagerProps> = ({
  employees,
  advances,
  userRole,
  onAddAdvance,
  onDeleteAdvance,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !amount) return;

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    onAddAdvance({
      employeeId: selectedEmployee,
      employeeName: employee.name,
      amount: parseFloat(amount),
      description: description || 'Advance payment',
      date: new Date().toISOString(),
    });

    setSelectedEmployee('');
    setAmount('');
    setDescription('');
  };

  const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advance Management</h2>
            <p className="text-gray-600">Record and track employee advances</p>
          </div>
        </div>
        {userRole === 'viewer' && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            View Only
          </span>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Total Advances Given</p>
            <p className="text-3xl font-bold">₹{totalAdvances.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Total Records</p>
            <p className="text-2xl font-semibold">{advances.length}</p>
          </div>
        </div>
      </div>

      {/* Add Advance Form */}
      {userRole === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-purple-600" />
            Record New Advance
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Reason for advance..."
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Advance
            </button>
          </form>
        </div>
      )}

      {/* Advances List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Advances</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {advances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No advances recorded yet</p>
            </div>
          ) : (
            advances.map((advance) => (
              <div key={advance.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{advance.employeeName}</h4>
                      <p className="text-sm text-gray-600">{advance.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(advance.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">₹{advance.amount.toLocaleString()}</p>
                    </div>
                    {userRole === 'admin' && (
                      <button
                        onClick={() => onDeleteAdvance(advance.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete advance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvanceManager;