import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [businessExists, setBusinessExists] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    operatingHoursStart: '09:00',
    operatingHoursEnd: '17:00',
    serviceAreaNotes: '',
    businessType: 'mobile',
    autoApproveAppointments: false,
    requireUpfrontDeposit: false,
    depositAmount: 35,
    depositMethod: 'manual',
    manualDepositInstructions: '',
    stripePublicKey: ''
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!userProfile?.businessId) return;
      try {
        const businessDoc = await getDoc(doc(db, 'businesses', userProfile.businessId));
        if (businessDoc.exists()) {
          setBusinessExists(true);
          const data = businessDoc.data();
          setFormData({
            name: data.name || data.businessName || '',
            phone: data.phone || '',
            address: data.address || '',
            operatingHoursStart: data.operatingHoursStart || '09:00',
            operatingHoursEnd: data.operatingHoursEnd || '17:00',
            serviceAreaNotes: data.serviceAreaNotes || '',
            businessType: data.businessType || 'mobile',
            autoApproveAppointments: data.autoApproveAppointments || false,
            requireUpfrontDeposit: data.requireUpfrontDeposit || false,
            depositAmount: data.depositAmount || 35,
            depositMethod: data.depositMethod || 'manual',
            manualDepositInstructions: data.manualDepositInstructions || '',
            stripePublicKey: data.stripePublicKey || ''
          });
        } else {
          setBusinessExists(false);
        }
      } catch (error) {
        console.error("Error fetching business settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.businessId) return;
    setSaving(true);
    
    try {
      const businessRef = doc(db, 'businesses', userProfile.businessId);
      const payload = {
        ...formData,
        businessName: formData.name,
      };
      if (businessExists) {
        await updateDoc(businessRef, payload);
      } else {
        await setDoc(businessRef, payload);
        setBusinessExists(true);
      }
      showToast('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving business settings:", error);
      showToast('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const copyBookingLink = () => {
    if (!userProfile?.businessId) return;
    const link = `${window.location.origin}/book/${userProfile.businessId}`;
    navigator.clipboard.writeText(link);
    showToast('Booking link copied to clipboard!');
  };

  if (loading) {
    return <div className="p-6 text-on-surface">Loading settings...</div>;
  }

  const bookingLink = userProfile?.businessId ? `${window.location.origin}/book/${userProfile.businessId}` : '';

  return (
    <div className="p-6 bg-surface-container-lowest min-h-screen relative">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Business Settings</h1>

      {toastMessage && (
        <div className="fixed top-6 right-6 bg-primary text-on-primary px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-sm">info</span>
          {toastMessage}
        </div>
      )}

      <div className="max-w-3xl space-y-8">
        
        {/* Booking Link Section */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">link</span>
            Your Public Booking Link
          </h2>
          <p className="text-on-surface-variant text-sm mb-4">
            Share this link with your clients so they can book appointments with you.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-grow bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface overflow-hidden text-ellipsis whitespace-nowrap">
              {bookingLink}
            </div>
            <button 
              onClick={copyBookingLink}
              className="bg-secondary-container text-on-secondary-container p-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-medium flex-shrink-0"
            >
              <span className="material-symbols-outlined">content_copy</span>
              Copy
            </button>
          </div>
        </section>

        {/* General Settings Form */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">store</span>
            Business Details
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Business Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Owner Email (Read-only)</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full bg-surface-container-lowest p-3 rounded-xl border border-outline-variant text-on-surface-variant opacity-70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Operating Hours - Start</label>
                <input
                  type="time"
                  name="operatingHoursStart"
                  value={formData.operatingHoursStart}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Operating Hours - End</label>
                <input
                  type="time"
                  name="operatingHoursEnd"
                  value={formData.operatingHoursEnd}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="mobile">Mobile Groomer</option>
                  <option value="salon">Salon Shop</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoApproveAppointments"
                  name="autoApproveAppointments"
                  checked={formData.autoApproveAppointments}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoApproveAppointments: e.target.checked }))}
                  className="w-5 h-5 rounded text-primary focus:ring-primary border-outline"
                />
                <label htmlFor="autoApproveAppointments" className="text-sm font-medium text-on-surface">
                  Auto-Approve Appointments
                  <p className="text-xs text-on-surface-variant font-normal">New bookings will bypass the pending queue.</p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Service Area & Notes</label>
              <textarea
                name="serviceAreaNotes"
                value={formData.serviceAreaNotes}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary resize-none"
                placeholder="e.g. Servicing the downtown area, 10 mile radius..."
              />
            </div>

            {/* Payments & Deposits Section */}
            <div className="border-t border-outline-variant pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Payments & Deposits
              </h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Configure upfront deposits to prevent no-shows. You can use your own Stripe account for automatic processing, or provide manual payment instructions (Venmo, Square, etc).
              </p>

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="requireUpfrontDeposit"
                  name="requireUpfrontDeposit"
                  checked={formData.requireUpfrontDeposit}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireUpfrontDeposit: e.target.checked }))}
                  className="w-5 h-5 rounded text-primary focus:ring-primary border-outline"
                />
                <label htmlFor="requireUpfrontDeposit" className="text-sm font-medium text-on-surface cursor-pointer">
                  Require Upfront Deposit
                  <p className="text-xs text-on-surface-variant font-normal">Clients must pay or agree to pay a deposit to secure their booking.</p>
                </label>
              </div>

              {formData.requireUpfrontDeposit && (
                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Deposit Amount ($)</label>
                    <input
                      type="number"
                      name="depositAmount"
                      min="1"
                      value={formData.depositAmount}
                      onChange={handleInputChange}
                      className="w-32 bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Deposit Collection Method</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-3 rounded-xl border border-outline-variant flex-1 hover:border-primary transition-colors">
                        <input 
                          type="radio" 
                          name="depositMethod" 
                          value="manual" 
                          checked={formData.depositMethod === 'manual'}
                          onChange={handleInputChange}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">Manual (Venmo / CashApp)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest p-3 rounded-xl border border-outline-variant flex-1 hover:border-primary transition-colors">
                        <input 
                          type="radio" 
                          name="depositMethod" 
                          value="stripe" 
                          checked={formData.depositMethod === 'stripe'}
                          onChange={handleInputChange}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium flex items-center gap-1">
                          Stripe 
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Auto</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.depositMethod === 'manual' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">Manual Payment Instructions</label>
                      <p className="text-xs text-on-surface-variant mb-2">These instructions will be shown to the client on the final booking step.</p>
                      <textarea
                        name="manualDepositInstructions"
                        value={formData.manualDepositInstructions}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary resize-none"
                        placeholder="e.g. To secure your slot, please Venmo $35 to @PawsGrooming. Your appointment will remain Pending until payment is received."
                      />
                    </div>
                  )}

                  {formData.depositMethod === 'stripe' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">Stripe Publishable Key</label>
                      <p className="text-xs text-on-surface-variant mb-2">Find this in your Stripe Dashboard under Developers &gt; API keys.</p>
                      <input
                        type="text"
                        name="stripePublicKey"
                        value={formData.stripePublicKey}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container-highest p-3 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary font-mono text-sm"
                        placeholder="pk_live_..."
                      />
                      <div className="mt-3 p-3 bg-primary-container/20 border border-primary/20 rounded-xl flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                        <p className="text-xs text-on-surface-variant">
                          By providing your Stripe Publishable Key, the booking widget will display a credit card form. (Note: For full transaction processing, a backend webhook integration may be required).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
