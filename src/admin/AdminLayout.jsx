// -------------------------------------------------------------
// SHADOW ASCENSION - SHARED OVERSEER ADMIN LAYOUT
// Houses AdminSidebar, AdminTopbar, and dynamic page <Outlet />
// -------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const contentRef = useRef(null);

  // Automatically close mobile sidebar on navigation & reset scroll position
  useEffect(() => {
    setIsSidebarOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div
      className="admin-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        height: '100vh',
        width: '100%',
        backgroundColor: '#07070b',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Persistent Left Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (AdminShell) */}
      <div
        className="admin-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#07070b'
        }}
      >
        {/* Sticky Topbar */}
        <AdminTopbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Dynamic Nested Page Content (<Outlet />) - The Scrolling Container */}
        <main
          ref={contentRef}
          className="admin-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px',
            boxSizing: 'border-box'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
