import React from 'react';
import { Building2, User, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  userRole: 'admin' | 'viewer' | null;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  userRole, 
  userName, 
  userEmail, 
  onLogout, 
  onToggleSidebar 
}) => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Logo and Brand */}
          <div className="flex items-center space-x-4">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JJ Construction</h1>
                <p className="text-sm text-gray-500">Workforce Management</p>
              </div>
            </div>
          </div>

          {/* Right Section - User Info and Actions */}
          <div className="flex items-center space-x-4">
            {userRole && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userName || userEmail?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole} • {userEmail}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  userRole === 'admin' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <User className="h-5 w-5" />
                </div>
              </div>
            )}

            {userRole && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;