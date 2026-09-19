import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';

// Same brand icon SVGs used in Settings — kept in sync
const BRAND_ICONS = {
  paw: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><ellipse cx="14" cy="12" rx="5" ry="6"/><ellipse cx="34" cy="12" rx="5" ry="6"/><ellipse cx="7" cy="24" rx="4" ry="5"/><ellipse cx="41" cy="24" rx="4" ry="5"/><path d="M24 42c-8 0-14-6-14-12 0-4 3-8 8-10a10 10 0 0112 0c5 2 8 6 8 10 0 6-6 12-14 12z"/></svg>,
  husky: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 4C18 4 14 8 12 12L6 16v8l4 2c1 6 5 12 14 14 9-2 13-8 14-14l4-2v-8l-6-4C34 8 30 4 24 4zm-6 20a3 3 0 110-6 3 3 0 010 6zm12 0a3 3 0 110-6 3 3 0 010 6zm-6 8c-3 0-5-1-5-3h10c0 2-2 3-5 3z"/></svg>,
  bone: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M12 10a6 6 0 00-4 10.5L20.5 33A6 6 0 1033 33l0 0 2.5-12.5A6 6 0 1033 8.5L20.5 21 8 8.5A6 6 0 0012 10z" transform="rotate(45 24 24)"/></svg>,
  shield: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 4L6 12v12c0 11 8 20 18 24 10-4 18-13 18-24V12L24 4z"/><ellipse cx="18" cy="20" rx="2.5" ry="3" fill="white" opacity="0.9"/><ellipse cx="30" cy="20" rx="2.5" ry="3" fill="white" opacity="0.9"/><path d="M24 36c-4 0-7-2-7-5 0-2 2-4 4-5a5 5 0 016 0c2 1 4 3 4 5 0 3-3 5-7 5z" fill="white" opacity="0.9"/></svg>,
  'star-dog': <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 2l6 14h14l-11 9 4 15-13-9-13 9 4-15L4 16h14z"/><circle cx="20" cy="20" r="2" fill="white"/><circle cx="28" cy="20" r="2" fill="white"/><ellipse cx="24" cy="26" rx="3" ry="2" fill="white"/></svg>,
  'heart-paw': <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 44l-2.8-2.5C9.2 30.8 2 24.3 2 16.5 2 10.4 6.8 6 12.5 6c3.6 0 7.1 1.8 9.2 4.5h4.6C28.4 7.8 31.9 6 35.5 6 41.2 6 46 10.4 46 16.5c0 7.8-7.2 14.3-19.2 25L24 44z"/><ellipse cx="18" cy="22" rx="2" ry="2.5" fill="white" opacity="0.9"/><ellipse cx="30" cy="22" rx="2" ry="2.5" fill="white" opacity="0.9"/><path d="M24 32c-3 0-5-1.5-5-3.5s2-4 5-4 5 2 5 4-2 3.5-5 3.5z" fill="white" opacity="0.9"/></svg>,
};

export default function AdminLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) {
    return <Login />;
  }

  const businessName = userProfile?.businessName || 'My Business';
  const role = userProfile?.role || 'Owner';
  const brandIcon = userProfile?.brandIcon || 'paw';
  const brandLogoUrl = userProfile?.brandLogoUrl || '';

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
        <div className="h-16 flex items-center gap-3 px-5 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-5 h-5">
                {BRAND_ICONS[brandIcon] || BRAND_ICONS.paw}
              </div>
            )}
          </div>
          <span className="text-base font-bold truncate">{businessName}</span>
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
