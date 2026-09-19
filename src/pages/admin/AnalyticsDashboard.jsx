import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEnrichedAppointments, getClientsWithPets } from '../../services/adminDb';

export default function AnalyticsDashboard() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.businessId) return;
      try {
        const [fetchedAppointments, fetchedClients] = await Promise.all([
          getEnrichedAppointments(userProfile.businessId),
          getClientsWithPets(userProfile.businessId)
        ]);
        setAppointments(fetchedAppointments || []);
        setClients(fetchedClients || []);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  if (loading) {
    return <div className="p-6 text-on-surface">Loading analytics...</div>;
  }

  // Calculate metrics
  const completedAppointments = appointments.filter(a => a.status === 'Completed');
  const totalRevenue = completedAppointments.reduce((sum, appt) => sum + (appt.service?.price || 0), 0);
  const totalBookings = appointments.length;
  const completedCount = completedAppointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const totalClients = clients.length;
  const totalPets = clients.reduce((sum, client) => sum + (client.pets?.length || 0), 0);
  const averageRevenue = completedCount > 0 ? (totalRevenue / completedCount) : 0;

  // Recent completed appointments
  const recentCompleted = [...completedAppointments]
    .sort((a, b) => {
      const dateA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
      const dateB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
      return dateB - dateA;
    })
    .slice(0, 10);

  const hasData = totalBookings > 0 || totalClients > 0;

  if (!hasData) {
    return (
      <div className="p-6 bg-surface-container-lowest min-h-screen">
        <h1 className="text-2xl font-bold text-on-surface mb-6">Analytics Dashboard</h1>
        <div className="bg-surface-container p-8 rounded-2xl text-center text-on-surface-variant border border-outline-variant">
          <span className="material-symbols-outlined text-4xl mb-2">monitoring</span>
          <p className="text-lg">No analytics data yet. Complete some appointments to see insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-container-lowest min-h-screen">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="payments" title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard icon="calendar_month" title="Total Bookings" value={totalBookings} />
        <StatCard icon="check_circle" title="Completed" value={completedCount} />
        <StatCard icon="schedule" title="Pending" value={pendingCount} />
        <StatCard icon="group" title="Total Clients" value={totalClients} />
        <StatCard icon="pets" title="Total Pets" value={totalPets} />
        <StatCard icon="analytics" title="Avg Revenue / Appt" value={`$${averageRevenue.toFixed(2)}`} />
      </div>

      <div className="bg-surface-container rounded-2xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-highest">
          <h2 className="text-lg font-bold text-on-surface">Recent Completed Appointments</h2>
        </div>
        
        {recentCompleted.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant">
            No completed appointments yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-sm border-b border-outline-variant">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Pet</th>
                  <th className="p-4 font-medium">Service</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentCompleted.map((appt) => {
                  const apptDate = appt.startTime?.toDate ? appt.startTime.toDate() : new Date(appt.startTime);
                  return (
                    <tr key={appt.id} className="border-b border-outline-variant hover:bg-surface-container-highest/50 text-on-surface">
                      <td className="p-4">{apptDate.toLocaleDateString()}</td>
                      <td className="p-4">{appt.client?.name || 'Unknown Client'}</td>
                      <td className="p-4">{appt.pet?.name || 'Unknown Pet'}</td>
                      <td className="p-4">{appt.service?.name || 'Unknown Service'}</td>
                      <td className="p-4 text-right font-medium text-primary">
                        ${appt.service?.price?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant flex items-start gap-4">
      <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl flex-shrink-0">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-on-surface-variant mb-1">{title}</p>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}
