import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';

export default function AdminLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) {
    return <Login />;
  }

  const businessName = userProfile?.businessName || 'My Business';
  const role = userProfile?.role || 'Owner';

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { name: 'Bookings & Approvals', path: '/admin/action-center', icon: 'how_to_reg' },
    { name: 'Clients & Pets', path: '/admin/directory', icon: 'pets' },
    { name: 'Service Menu', path: '/admin/services', icon: 'list_alt' },
    { name: 'Analytics', path: '/admin/analytics', icon: 'bar_chart' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="flex h-screen bg-surface-container-lowest text-on-surface font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container flex flex-col border-r border-outline-variant">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-outline-variant">
          <span className="text-lg font-bold truncate">{businessName}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-3">{link.icon}</span>
                    <span className="font-medium text-sm">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-outline-variant">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium truncate">{currentUser.email}</div>
            <div className="text-xs text-on-surface-variant capitalize">{role}</div>
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center justify-center w-full py-2 px-4 rounded-lg bg-error text-on-error hover:bg-error-container hover:text-on-error-container transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-transparent text-sm"
              />
            </div>
          </div>
          <div className="ml-4">
            <button 
              onClick={() => window.open(`/book/${userProfile.businessId}`, '_blank')}
              className="flex items-center px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors font-medium text-sm"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
              New Appointment
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
