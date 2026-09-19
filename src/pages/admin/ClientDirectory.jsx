import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getClientsWithBookingStatus } from '../../services/adminDb';

export default function ClientDirectory() {
  const { userProfile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [activeTab, setActiveTab] = useState('confirmed');

  useEffect(() => {
    if (!userProfile?.businessId) return;

    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await getClientsWithBookingStatus(userProfile.businessId);
        setClients(data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load clients directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [userProfile?.businessId]);

  const confirmedClients = clients.filter(c => c.isConfirmedClient);
  const leadClients = clients.filter(c => !c.isConfirmedClient);

  const activeClients = activeTab === 'confirmed' ? confirmedClients : leadClients;

  const filteredClients = activeClients.filter(client =>
    client.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedClientId(prev => prev === id ? null : id);
  };

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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Clients & Pets</h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">groups</span>
            {clients.length} total client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="relative max-w-md w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search by client name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </header>

      {/* --- Tab Buttons --- */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('confirmed'); setSearchQuery(''); }}
          className={`
            flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${activeTab === 'confirmed'
              ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
              : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high hover:border-outline'
            }
          `}
        >
          <span className="material-symbols-outlined text-lg">verified</span>
          Confirmed Clients
          <span className={`
            min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5
            ${activeTab === 'confirmed'
              ? 'bg-on-primary/20 text-on-primary'
              : 'bg-outline-variant/40 text-on-surface-variant'
            }
          `}>
            {confirmedClients.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('leads'); setSearchQuery(''); }}
          className={`
            flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${activeTab === 'leads'
              ? 'bg-tertiary text-on-tertiary border-tertiary shadow-md shadow-tertiary/20'
              : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high hover:border-outline'
            }
          `}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Leads
          <span className={`
            min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5
            ${activeTab === 'leads'
              ? 'bg-on-tertiary/20 text-on-tertiary'
              : 'bg-outline-variant/40 text-on-surface-variant'
            }
          `}>
            {leadClients.length}
          </span>
        </button>
      </div>

      {/* --- Tab Description --- */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border ${
        activeTab === 'confirmed'
          ? 'bg-primary-container/30 border-primary/20 text-on-surface'
          : 'bg-tertiary-container/30 border-tertiary/20 text-on-surface'
      }`}>
        <span className={`material-symbols-outlined text-lg ${activeTab === 'confirmed' ? 'text-primary' : 'text-tertiary'}`}>
          {activeTab === 'confirmed' ? 'info' : 'lightbulb'}
        </span>
        {activeTab === 'confirmed'
          ? 'Clients with at least one confirmed or completed booking.'
          : 'Contacts from pending bookings — great for follow-ups and future outreach.'
        }
      </div>

      {/* --- Client Cards --- */}
      {activeClients.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 border border-outline-variant text-on-surface-variant flex-1">
          <span className="material-symbols-outlined text-6xl">
            {activeTab === 'confirmed' ? 'how_to_reg' : 'person_search'}
          </span>
          <p className="text-lg">
            {activeTab === 'confirmed'
              ? 'No confirmed clients yet. Approve a booking to see clients here.'
              : 'No leads yet. Pending bookings will create leads here.'
            }
          </p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 border border-outline-variant text-on-surface-variant flex-1">
          <span className="material-symbols-outlined text-5xl">search_off</span>
          <p className="text-lg">No clients found matching "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            const hasPets = client.pets && client.pets.length > 0;
            
            return (
              <div key={client.id} className="bg-surface-container rounded-2xl border border-outline-variant flex flex-col overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                        client.isConfirmedClient
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        {client.ownerName?.charAt(0).toUpperCase() || <span className="material-symbols-outlined">person</span>}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-lg line-clamp-1">{client.ownerName}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md inline-block w-fit">
                            {client.pets?.length || 0} Pet{(client.pets?.length !== 1) ? 's' : ''}
                          </span>
                          {client.totalAppointments > 0 && (
                            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">calendar_month</span>
                              {client.totalAppointments} booking{client.totalAppointments !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Chip */}
                    {activeTab === 'leads' && client.lastAppointment && (
                      <span className="text-xs bg-tertiary-container text-on-tertiary-container px-2.5 py-1 rounded-full font-medium whitespace-nowrap mt-1">
                        {client.lastAppointment.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm text-on-surface-variant bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">call</span>
                      {client.phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      {client.email || 'No email'}
                    </div>
                  </div>

                  {/* Last Visit / Last Request */}
                  {client.lastAppointment && (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {activeTab === 'confirmed' ? 'Last booking:' : 'Requested:'}
                      {' '}
                      {new Date(client.lastAppointment.startTime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                {hasPets && (
                  <div className="border-t border-outline-variant bg-surface-container-high">
                    <button 
                      onClick={() => toggleExpand(client.id)}
                      className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">pets</span>
                        View Pets
                      </span>
                      <span className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
                        {client.pets.map(pet => (
                          <div key={pet.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-base">{pet.petName}</h4>
                              {pet.size && (
                                <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full font-medium">
                                  {pet.size}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-on-surface-variant">
                              {pet.breed && (
                                <div className="flex items-center gap-2">
                                  <span className="w-20 font-medium">Breed:</span>
                                  <span>{pet.breed}</span>
                                </div>
                              )}
                              {pet.temperament && (
                                <div className="flex items-center gap-2">
                                  <span className="w-20 font-medium">Behavior:</span>
                                  <span>{pet.temperament}</span>
                                </div>
                              )}
                              {pet.rabiesExpiration && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="w-20 font-medium">Rabies Exp:</span>
                                  <span className={`font-semibold ${new Date(pet.rabiesExpiration) < new Date() ? 'text-error' : 'text-primary'}`}>
                                    {new Date(pet.rabiesExpiration).toLocaleDateString()}
                                    {new Date(pet.rabiesExpiration) < new Date() && ' (EXPIRED)'}
                                  </span>
                                </div>
                              )}
                              {pet.notes && (
                                <div className="flex items-start gap-2 mt-1 pt-2 border-t border-outline-variant/50">
                                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">sticky_note_2</span>
                                  <span className="italic">{pet.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
