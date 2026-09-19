import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getServices } from '../../services/db';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function ServicesManager() {
  const { userProfile } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    type: 'core',
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const fetchServices = useCallback(async () => {
    if (!userProfile?.businessId) return;
    setLoading(true);
    try {
      const fetchedServices = await getServices(userProfile.businessId);
      setServices(fetchedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.businessId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.businessId) return;
    
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        type: formData.type,
        isActive: formData.isActive
      };

      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), serviceData);
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          businessId: userProfile.businessId,
          createdAt: serverTimestamp()
        });
      }
      handleCloseModal();
      await fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
        await fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleEditClick = (service) => {
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      durationMinutes: service.durationMinutes.toString(),
      type: service.type,
      isActive: service.isActive
    });
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="p-6 text-on-surface">Loading services...</div>;
  }

  return (
    <div className="p-6 bg-surface-container-lowest min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Services Manager</h1>
        <button 
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-surface-container p-8 rounded-2xl text-center text-on-surface-variant border border-outline-variant">
          <span className="material-symbols-outlined text-4xl mb-2">pet_supplies</span>
          <p className="text-lg">No services configured yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-surface-container rounded-2xl p-6 border border-outline-variant flex flex-col h-full shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-on-surface">{service.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                  service.isActive 
                    ? 'bg-secondary-container text-on-secondary-container' 
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-on-surface-variant mb-4 flex-grow text-sm line-clamp-3">
                {service.description}
              </p>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span className="font-semibold">${service.price}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{service.durationMinutes} mins</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface text-sm">
                  <span className="material-symbols-outlined text-sm">category</span>
                  <span className="capitalize">{service.type.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-auto">
                <button 
                  onClick={() => handleEditClick(service)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-full hover:bg-surface-container-highest"
                  title="Edit"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center rounded-full hover:bg-surface-container-highest"
                  title="Delete"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-on-surface">
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Service Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="core">Core Service</option>
                  <option value="package_addon">Package Add-on</option>
                  <option value="single_addon">Single Add-on</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-on-surface">Service is Active</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-full text-on-surface hover:bg-surface-container-highest transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
