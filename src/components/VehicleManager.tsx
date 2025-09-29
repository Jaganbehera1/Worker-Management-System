import React, { useState } from 'react';
import { Vehicle, FuelRecord } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { Truck, Plus, Fuel, CreditCard as Edit2, Trash2, Search } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  userRole: 'admin' | 'viewer';
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onAddFuelRecord: (fuelRecord: Omit<FuelRecord, 'id' | 'createdAt'>) => void;
  onDeleteFuelRecord: (id: string) => void;
}

const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicles,
  fuelRecords,
  userRole,
  onAddVehicle,
  onAddFuelRecord,
  onDeleteFuelRecord,
}) => {
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [showAddFuelForm, setShowAddFuelForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [vehicleFormData, setVehicleFormData] = useState({
    vehicleNumber: '',
    vehicleName: '',
    vehicleType: 'JCB',
  });

  const [fuelFormData, setFuelFormData] = useState({
    vehicleId: '',
    fuelAmount: 0,
    fuelCost: 0,
    description: '',
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicle(vehicleFormData);
    setVehicleFormData({ vehicleNumber: '', vehicleName: '', vehicleType: 'JCB' });
    setShowAddVehicleForm(false);
  };

  const handleAddFuelRecord = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFuelRecord({
      ...fuelFormData,
      date: new Date().toISOString(),
    });
    setFuelFormData({ vehicleId: '', fuelAmount: 0, fuelCost: 0, description: '' });
    setShowAddFuelForm(false);
  };

  const getVehicleFuelRecords = (vehicleId: string) => {
    return fuelRecords.filter(record => record.vehicleId === vehicleId);
  };

  const getMonthlyFuelSummary = (vehicleId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = fuelRecords.filter(record => {
      return record.vehicleId === vehicleId && 
             record.date.slice(0, 7) === currentMonth;
    });

    const totalFuel = monthlyRecords.reduce((sum, record) => sum + record.fuelAmount, 0);
    const totalCost = monthlyRecords.reduce((sum, record) => sum + record.fuelCost, 0);

    return { totalFuel, totalCost, recordCount: monthlyRecords.length };
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vehicleTypes = ['JCB', 'Truck', 'Crane', 'Bulldozer', 'Excavator', 'Loader', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Truck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vehicle Management</h2>
            <p className="text-gray-600">Manage vehicles and fuel records</p>
          </div>
        </div>
        <div className="flex gap-2">
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setShowAddVehicleForm(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </button>
              <button
                onClick={() => setShowAddFuelForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Fuel className="h-4 w-4" />
                Add Fuel Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Vehicle Form */}
      {showAddVehicleForm && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Vehicle</h2>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  required
                  value={vehicleFormData.vehicleNumber}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="e.g., MH12AB1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Name
                </label>
                <input
                  type="text"
                  required
                  value={vehicleFormData.vehicleName}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="e.g., Site JCB 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleFormData.vehicleType}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Add Vehicle
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVehicleForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fuel Record Form */}
      {showAddFuelForm && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Fuel Record</h2>
            <form onSubmit={handleAddFuelRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle
                </label>
                <select
                  required
                  value={fuelFormData.vehicleId}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleNumber} - {vehicle.vehicleName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Cost (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={fuelFormData.fuelCost}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, fuelCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter fuel cost"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={fuelFormData.description}
                  onChange={(e) => setFuelFormData({ ...fuelFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning refill"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Add Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFuelForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles by number, name, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => {
          const fuelSummary = getMonthlyFuelSummary(vehicle.id);
          const vehicleFuelRecords = getVehicleFuelRecords(vehicle.id);
          
          return (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.vehicleName}</h3>
                    <p className="text-sm text-gray-600">{vehicle.vehicleNumber}</p>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mt-1">
                      {vehicle.vehicleType}
                    </span>
                  </div>
                </div>
                {userRole === 'admin' && (
                  <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Monthly Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 text-sm mb-2">This Month</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <p className="font-medium text-green-600">{formatCurrency(fuelSummary.totalCost)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Records:</span>
                    <p className="font-medium text-gray-900">{fuelSummary.recordCount} entries</p>
                  </div>
                </div>
              </div>

              {/* Recent Fuel Records */}
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-2">Recent Records</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {vehicleFuelRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <div className="text-right">
                        <span className="font-medium text-green-600">{formatCurrency(record.fuelCost)}</span>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => onDeleteFuelRecord(record.id)}
                            className="ml-2 text-red-600 hover:text-red-800"
                            title="Delete record"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {vehicleFuelRecords.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-2">No fuel records yet</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredVehicles.length === 0 && !searchTerm && (
          <div className="col-span-full text-center py-12">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first vehicle to the system.</p>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowAddVehicleForm(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Add First Vehicle
              </button>
            )}
          </div>
        )}

        {filteredVehicles.length === 0 && searchTerm && (
          <div className="col-span-full text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* All Fuel Records */}
      {fuelRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Fuel Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  {userRole === 'admin' && (
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fuelRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{vehicle?.vehicleName}</div>
                            <div className="text-sm text-gray-600">{vehicle?.vehicleNumber}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(record.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(record.fuelCost)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {record.description || '-'}
                        </td>
                        {userRole === 'admin' && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onDeleteFuelRecord(record.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManager;