import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'viewer' | null;
  userData?: any;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, userData, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        userRole={userRole}
        userName={userData?.name}
        userEmail={userData?.email}
        onLogout={onLogout}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;