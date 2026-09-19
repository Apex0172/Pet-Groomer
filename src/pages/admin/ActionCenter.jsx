import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEnrichedAppointments, updateAppointmentStatus } from '../../services/adminDb';

export default function ActionCenter() {
  const { userProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'Confirmed'

  const fetchAppointments = useCallback(async () => {
    if (!userProfile?.businessId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await getEnrichedAppointments(userProfile.businessId);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.businessId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (fullApp, newStatus) => {
    try {
      await updateAppointmentStatus(fullApp.id, newStatus, fullApp);
      await fetchAppointments();
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
    }
  };

  const pendingAppointments = appointments.filter((app) => app.status === 'Pending');
  const approvedAppointments = appointments.filter((app) => app.status === 'Confirmed');

  const displayedAppointments = activeTab === 'Pending' ? pendingAppointments : approvedAppointments;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Bookings & Approvals</h1>
        <p className="text-on-surface-variant">Manage appointment requests and upcoming bookings.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant mb-6">
        <button
          onClick={() => setActiveTab('Pending')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center ${
            activeTab === 'Pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          Pending Review 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'Pending' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {pendingAppointments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('Confirmed')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center ${
            activeTab === 'Confirmed'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          Approved 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'Confirmed' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {approvedAppointments.length}
          </span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {displayedAppointments.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_busy</span>
            <h3 className="text-lg font-medium text-on-surface">No {activeTab.toLowerCase()} bookings</h3>
            <p className="text-on-surface-variant text-sm mt-1">
              {activeTab === 'Pending' 
                ? "You're all caught up on requests." 
                : "There are no approved bookings at the moment."}
            </p>
          </div>
        ) : (
          displayedAppointments.map((app) => (
            <div key={app.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Info section */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Date & Time</p>
                    {app.isRecurring && (
                      <span className="text-[10px] font-bold bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-sm">
                        RECURRING
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{new Date(app.startTime).toLocaleDateString()}</p>
                  <p className="text-sm text-on-surface-variant">{new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 font-medium uppercase tracking-wider">Client</p>
                  <p className="text-sm font-semibold text-on-surface">{app.client?.ownerName}</p>
                  <p className="text-sm text-on-surface-variant">{app.client?.phone}</p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant mb-1 font-medium uppercase tracking-wider">Location</p>
                  <p className="text-sm font-semibold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">{app.location === 'salon' ? 'store' : 'home'}</span>
                    {app.location === 'salon' ? 'Salon' : 'Mobile'}
                  </p>
                  {app.location === 'mobile' && app.client?.address && (
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2" title={app.client.address}>{app.client.address}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant mb-1 font-medium uppercase tracking-wider">Pet</p>
                  <p className="text-sm font-semibold text-on-surface">{app.pet?.petName}</p>
                  <p className="text-sm text-on-surface-variant">{app.pet?.breed} • {app.pet?.size}</p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant mb-1 font-medium uppercase tracking-wider">Service</p>
                  <p className="text-sm font-semibold text-on-surface">{app.service?.name}</p>
                  <p className="text-sm text-on-surface-variant">${app.service?.price} • {app.service?.durationMinutes}m</p>
                </div>
              </div>

              {/* Actions section */}
              <div className="flex items-center gap-3 md:border-l md:border-outline-variant md:pl-6">
                {app.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(app, 'Rejected')}
                      className="px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-error-container hover:text-on-error-container hover:border-transparent transition-colors text-sm font-medium"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleStatusChange(app, 'Confirmed')}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                  </>
                )}
                {app.status === 'Confirmed' && (
                  <button
                    onClick={() => handleStatusChange(app, 'Completed')}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors text-sm font-medium"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
