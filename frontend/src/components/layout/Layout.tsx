import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50" data-id="uk9zngm7p" data-path="src/components/layout/Layout.tsx">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} data-id="ke46fck4a" data-path="src/components/layout/Layout.tsx" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden" data-id="p981qpo8d" data-path="src/components/layout/Layout.tsx">
        {/* Header */}
        <Header
          onToggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed} data-id="za2gemxlp" data-path="src/components/layout/Layout.tsx" />

        
        {/* Page Content */}
        <main className="flex-1 overflow-auto" data-id="5ofowlndt" data-path="src/components/layout/Layout.tsx">
          <div className="p-6" data-id="af3c03i8p" data-path="src/components/layout/Layout.tsx">
            <Outlet data-id="xz3yrqgpk" data-path="src/components/layout/Layout.tsx" />
          </div>
        </main>
      </div>
    </div>);

};

export default Layout;