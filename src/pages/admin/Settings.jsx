import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    stripePublicKey: '',
    brandIcon: 'paw',
    brandLogoUrl: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Premium dog/pet icon options
  const brandIcons = [
    { id: 'paw', label: 'Paw Print', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><ellipse cx="14" cy="12" rx="5" ry="6"/><ellipse cx="34" cy="12" rx="5" ry="6"/><ellipse cx="7" cy="24" rx="4" ry="5"/><ellipse cx="41" cy="24" rx="4" ry="5"/><path d="M24 42c-8 0-14-6-14-12 0-4 3-8 8-10a10 10 0 0112 0c5 2 8 6 8 10 0 6-6 12-14 12z"/></svg> },
    { id: 'husky', label: 'Husky', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 4C18 4 14 8 12 12L6 16v8l4 2c1 6 5 12 14 14 9-2 13-8 14-14l4-2v-8l-6-4C34 8 30 4 24 4zm-6 20a3 3 0 110-6 3 3 0 010 6zm12 0a3 3 0 110-6 3 3 0 010 6zm-6 8c-3 0-5-1-5-3h10c0 2-2 3-5 3z"/></svg> },
    { id: 'bone', label: 'Dog Bone', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M12 10a6 6 0 00-4 10.5L20.5 33A6 6 0 1033 33l0 0 2.5-12.5A6 6 0 1033 8.5L20.5 21 8 8.5A6 6 0 0012 10z" transform="rotate(45 24 24)"/></svg> },
    { id: 'shield', label: 'Pet Shield', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 4L6 12v12c0 11 8 20 18 24 10-4 18-13 18-24V12L24 4z"/><ellipse cx="18" cy="20" rx="2.5" ry="3" fill="white" opacity="0.9"/><ellipse cx="30" cy="20" rx="2.5" ry="3" fill="white" opacity="0.9"/><path d="M24 36c-4 0-7-2-7-5 0-2 2-4 4-5a5 5 0 016 0c2 1 4 3 4 5 0 3-3 5-7 5z" fill="white" opacity="0.9"/></svg> },
    { id: 'star-dog', label: 'Star Dog', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 2l6 14h14l-11 9 4 15-13-9-13 9 4-15L4 16h14z"/><circle cx="20" cy="20" r="2" fill="white"/><circle cx="28" cy="20" r="2" fill="white"/><ellipse cx="24" cy="26" rx="3" ry="2" fill="white"/></svg> },
    { id: 'heart-paw', label: 'Heart Paw', svg: <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full"><path d="M24 44l-2.8-2.5C9.2 30.8 2 24.3 2 16.5 2 10.4 6.8 6 12.5 6c3.6 0 7.1 1.8 9.2 4.5h4.6C28.4 7.8 31.9 6 35.5 6 41.2 6 46 10.4 46 16.5c0 7.8-7.2 14.3-19.2 25L24 44z"/><ellipse cx="18" cy="22" rx="2" ry="2.5" fill="white" opacity="0.9"/><ellipse cx="30" cy="22" rx="2" ry="2.5" fill="white" opacity="0.9"/><path d="M24 32c-3 0-5-1.5-5-3.5s2-4 5-4 5 2 5 4-2 3.5-5 3.5z" fill="white" opacity="0.9"/></svg> }
  ];

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
            stripePublicKey: data.stripePublicKey || '',
            brandIcon: data.brandIcon || 'paw',
            brandLogoUrl: data.brandLogoUrl || ''
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userProfile?.businessId) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `brand-logos/${userProfile.businessId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, brandLogoUrl: downloadUrl, brandIcon: 'custom' }));
      showToast('Logo uploaded! Don\'t forget to Save Changes.');
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeCustomLogo = () => {
    setFormData(prev => ({ ...prev, brandLogoUrl: '', brandIcon: 'paw' }));
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

        {/* Brand & Logo Section */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">palette</span>
            Brand Identity
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">Choose a premium icon for your brand or upload your own logo. This will appear in the sidebar and on your booking page.</p>

          {/* Premium Icon Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-on-surface-variant mb-3">Choose a Brand Icon</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {brandIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, brandIcon: icon.id, brandLogoUrl: '' }))}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 group
                    ${formData.brandIcon === icon.id && !formData.brandLogoUrl
                      ? 'border-primary bg-primary-container/40 shadow-md shadow-primary/10 scale-105'
                      : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-high'
                    }
                  `}
                >
                  <div className={`w-10 h-10 transition-colors ${
                    formData.brandIcon === icon.id && !formData.brandLogoUrl
                      ? 'text-primary'
                      : 'text-on-surface-variant group-hover:text-primary'
                  }`}>
                    {icon.svg}
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant text-center leading-tight">{icon.label}</span>
                  {formData.brandIcon === icon.id && !formData.brandLogoUrl && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs">check</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant"></div>
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">or upload your own</span>
            <div className="flex-1 h-px bg-outline-variant"></div>
          </div>

          {/* Custom Logo Upload */}
          <div className="flex items-center gap-4">
            {formData.brandLogoUrl ? (
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary shadow-md">
                  <img src={formData.brandLogoUrl} alt="Brand Logo" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={removeCustomLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-all"
              >
                {uploadingLogo ? (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                )}
              </div>
            )}
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {formData.brandLogoUrl ? 'Change Logo' : 'Upload Custom Logo'}
              </button>
              <p className="text-xs text-on-surface-variant mt-0.5">PNG, JPG, or SVG • Max 2MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Live Preview */}
          <div className="mt-6 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <label className="block text-xs font-medium text-on-surface-variant mb-3 uppercase tracking-wider">Preview</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center overflow-hidden shrink-0">
                {formData.brandLogoUrl ? (
                  <img src={formData.brandLogoUrl} alt="Logo" className="w-full h-full object-cover bg-white" />
                ) : (
                  <div className="w-6 h-6">
                    {brandIcons.find(i => i.id === formData.brandIcon)?.svg}
                  </div>
                )}
              </div>
              <span className="text-lg font-bold text-on-surface truncate">
                {formData.name || 'Your Business Name'}
              </span>
            </div>
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
