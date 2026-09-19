import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllBusinesses, getAllUsers } from '../../services/superAdminDb';

export default function SuperAdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bData = await getAllBusinesses();
        const uData = await getAllUsers();
        setBusinesses(bData || []);
        setUsers(uData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-container-lowest">
        <div className="text-on-surface font-headline-md animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="w-full px-6 flex items-center justify-between h-16 border-b border-outline-variant bg-surface-container-lowest text-on-surface top-0 shadow-sm z-50 sticky">
        <div className="flex items-center gap-8 h-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
              <span className="material-symbols-outlined text-[18px]">pets</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-title-md font-semibold text-on-surface tracking-tight">PetOps Super Admin</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-container-high text-on-surface border border-outline-variant">Super Admin</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-body-sm font-medium text-on-surface">
            {currentUser?.email}
          </div>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-on-primary text-label-md font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-[2rem] text-on-surface font-semibold tracking-tight">Platform Operations</h1>
            <p className="font-body-md text-on-surface-variant mt-1">Manage tenants and users across the platform.</p>
          </div>
        </div>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">storefront</span>
              </div>
              <div>
                <span className="text-label-sm uppercase tracking-wider text-outline">Total Active Tenants</span>
                <div className="font-display-md text-3xl text-on-surface font-bold">{businesses.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
              <div>
                <span className="text-label-sm uppercase tracking-wider text-outline">Total Registered Users</span>
                <div className="font-display-md text-3xl text-on-surface font-bold">{users.length}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant">
            <h2 className="text-title-lg font-semibold text-on-surface">Tenants List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container text-label-sm text-outline uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold" scope="col">Business Name</th>
                  <th className="py-4 px-6 font-semibold" scope="col">Tenant ID</th>
                  <th className="py-4 px-6 font-semibold" scope="col">Owner Info</th>
                  <th className="py-4 px-6 font-semibold" scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-md">
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 px-6 text-center text-on-surface-variant">
                      No tenants found.
                    </td>
                  </tr>
                ) : (
                  businesses.map((business) => {
                    const owner = users.find(u => u.uid === business.ownerId || u.id === business.ownerId);
                    const ownerEmail = owner ? owner.email : 'Unknown';
                    const status = business.status || 'Active';

                    return (
                      <tr key={business.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-6 font-medium text-on-surface">
                          {business.businessName || 'Unnamed Business'}
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant font-mono text-sm">
                          {business.id}
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">
                          {ownerEmail}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-medium ${
                            status.toLowerCase() === 'active' 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'bg-surface-variant text-on-surface-variant border border-outline-variant'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
