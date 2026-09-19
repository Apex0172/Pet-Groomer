import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEnrichedAppointments } from '../../services/adminDb';
import { format, isToday, isThisWeek } from 'date-fns';

export default function DashboardCalendar() {
  const { userProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userProfile?.businessId) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await getEnrichedAppointments(userProfile.businessId);
        setAppointments(data || []);
      } catch (err) {
        setError('Failed to load appointments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userProfile?.businessId]);

  const today = new Date();
  
  const todayAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (!app.startTime) return false;
      const date = new Date(app.startTime);
      return isToday(date);
    });
  }, [appointments]);

  const upcomingThisWeek = useMemo(() => {
    return appointments
      .filter(app => {
        if (!app.startTime) return false;
        const date = new Date(app.startTime);
        return isThisWeek(date) && !isToday(date) && app.status === 'Confirmed';
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [appointments]);

  const todayStats = useMemo(() => {
    const total = todayAppointments.length;
    const pending = todayAppointments.filter(a => a.status === 'Pending').length;
    const confirmed = todayAppointments.filter(a => a.status === 'Confirmed').length;
    const revenue = todayAppointments
      .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
      .reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);
    
    return { total, pending, confirmed, revenue };
  }, [todayAppointments]);

  const todayConfirmed = useMemo(() => {
    return todayAppointments
      .filter(a => a.status === 'Confirmed')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [todayAppointments]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-container-lowest text-on-surface p-6">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-surface-container-lowest h-full text-on-surface">
        <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-container-lowest min-h-full flex flex-col gap-6 text-on-surface">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-on-surface-variant">{format(today, 'EEEE, MMMM do, yyyy')}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2 border border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="text-sm font-medium">Total Today</span>
          </div>
          <span className="text-3xl font-semibold">{todayStats.total}</span>
        </div>
        
        <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2 border border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">hourglass_empty</span>
            <span className="text-sm font-medium">Pending</span>
          </div>
          <span className="text-3xl font-semibold">{todayStats.pending}</span>
        </div>

        <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2 border border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-sm font-medium">Confirmed</span>
          </div>
          <span className="text-3xl font-semibold">{todayStats.confirmed}</span>
        </div>

        <div className="bg-surface-container p-4 rounded-2xl flex flex-col gap-2 border border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">payments</span>
            <span className="text-sm font-medium">Est. Revenue</span>
          </div>
          <span className="text-3xl font-semibold">${todayStats.revenue.toFixed(2)}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">today</span>
            Today's Confirmed Appointments
          </h2>
          
          {todayConfirmed.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 border border-outline-variant text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl">event_available</span>
              <p>No confirmed appointments today. Enjoy the day!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {todayConfirmed.map((app) => (
                <div key={app.id} className="bg-surface-container p-4 rounded-2xl border border-outline-variant flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl w-16 h-16 shrink-0 font-medium">
                      <span>{format(new Date(app.startTime), 'h:mm')}</span>
                      <span className="text-xs uppercase">{format(new Date(app.startTime), 'a')}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">{app.pet?.petName} <span className="text-on-surface-variant text-sm font-normal">({app.pet?.breed})</span></span>
                      <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {app.client?.ownerName}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">content_cut</span>
                        {app.service?.name} ({app.service?.durationMinutes} min)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-sm font-medium">
                    {app.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">date_range</span>
            Upcoming This Week
          </h2>
          
          {upcomingThisWeek.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 border border-outline-variant text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl">event_busy</span>
              <p className="text-sm">No more upcoming appointments this week.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingThisWeek.map((app) => (
                <div key={app.id} className="bg-surface-container p-3 rounded-2xl border border-outline-variant flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{format(new Date(app.startTime), 'EEE, MMM d')}</span>
                    <span className="text-sm text-on-surface-variant">{format(new Date(app.startTime), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-medium">{app.pet?.petName}</span>
                    <span className="text-on-surface-variant">- {app.service?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
