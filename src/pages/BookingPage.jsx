import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getAvailableTimeSlots, submitBooking, getServices, getBusiness } from '../services/db';

export default function BookingPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState(null);
  const [coreServices, setCoreServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  const [petSize, setPetSize] = useState('Medium');
  const [selectedCore, setSelectedCore] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [recurringFrequency, setRecurringFrequency] = useState(0); // 0=once, 4,6,8 weeks
  const [serviceLocation, setServiceLocation] = useState('mobile'); // 'mobile' or 'salon'
  
  const [clientDetails, setClientDetails] = useState({ name: '', email: '', phone: '', address: '' });
  const [petDetails, setPetDetails] = useState({ name: '', breed: '', temperament: 'Friendly' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Derived totals
  const totalDuration = (selectedCore?.durationMinutes || 0) + selectedAddons.reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalPrice = (selectedCore?.price || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  useEffect(() => {
    async function loadData() {
      setLoadingServices(true);
      try {
        const [fetchedServices, businessData] = await Promise.all([
          getServices(businessId),
          getBusiness(businessId)
        ]);
        
        if (businessData) {
          setBusiness(businessData);
          if (businessData.businessType === 'salon') {
            setServiceLocation('salon');
          }
        }
        
        const cores = fetchedServices.filter(s => (s.type === 'core' || !s.type) && s.isActive !== false);
        const adds = fetchedServices.filter(s => (s.type === 'package_addon' || s.type === 'single_addon') && s.isActive !== false);
        
        setCoreServices(cores);
        setAddons(adds);
      } catch (err) {
        console.error('Error loading services:', err);
      }
      setLoadingServices(false);
    }
    loadData();
  }, [businessId]);

  useEffect(() => {
    if (step === 3 && selectedDate && totalDuration > 0) {
      async function loadSlots() {
        try {
          const slots = await getAvailableTimeSlots(businessId, format(selectedDate, 'yyyy-MM-dd'), totalDuration, business);
          setAvailableSlots(slots);
        } catch(err) {
          console.error(err);
        }
      }
      loadSlots();
    }
  }, [selectedDate, step, businessId, totalDuration, business]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (business?.requireUpfrontDeposit) {
      setStep(5); // Go to Deposit & Confirmation
    } else {
      executeBooking();
    }
  };

  const executeBooking = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const consolidatedService = {
        id: selectedCore.id,
        name: selectedCore.name,
        petSize: petSize,
        durationMinutes: totalDuration,
        price: totalPrice,
        depositRequired: business?.requireUpfrontDeposit || false,
        addons: selectedAddons.map(a => a.name),
        recurringFrequency: recurringFrequency,
        location: serviceLocation
      };

      await submitBooking(businessId, consolidatedService, selectedTime, clientDetails, petDetails, business);
      setStep(6); // Success screen
    } catch (err) {
      console.error(err);
      setError("Failed to submit booking. " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const dogSizes = [
    { name: 'Small', desc: 'Under 20 lbs' },
    { name: 'Medium', desc: '20 - 50 lbs' },
    { name: 'Large', desc: '50 - 80 lbs' },
    { name: 'Giant', desc: '80+ lbs' }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-background text-on-surface font-body-md antialiased">
      {/* LEFT PANEL */}
      <aside className="w-full lg:w-5/12 xl:w-[42%] relative lg:fixed lg:top-0 lg:left-0 lg:h-screen z-20 flex flex-col justify-between overflow-hidden bg-inverse-surface text-inverse-on-surface">
        <img alt="Dog grooming" className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-[0.78] contrast-105 pointer-events-none" src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop" />
        <div className="absolute inset-0 bg-gradient-to-t from-on-background via-on-background/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-on-background/80 via-transparent to-transparent"></div>
        
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-primary shadow-sm border border-white/20">
              <span className="material-symbols-outlined text-2xl" data-weight="fill">pets</span>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold text-white tracking-tight block">{business?.name || 'Pet Grooming'}</span>
              <span className="font-body-sm text-body-sm text-surface-variant font-medium tracking-wide">
                {business?.businessType === 'salon' ? 'Professional Salon & Spa' : 'Mobile Salon & Wellness'}
              </span>
            </div>
          </div>
          {business?.businessType !== 'salon' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 backdrop-blur-md text-white border border-secondary-fixed/30 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping"></span>
              Mobile Unit Active
            </span>
          )}
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
            <div className="flex text-amber-300">
              <span className="material-symbols-outlined text-sm" data-weight="fill">star</span>
              <span className="material-symbols-outlined text-sm" data-weight="fill">star</span>
              <span className="material-symbols-outlined text-sm" data-weight="fill">star</span>
              <span className="material-symbols-outlined text-sm" data-weight="fill">star</span>
              <span className="material-symbols-outlined text-sm" data-weight="fill">star</span>
            </div>
            <span className="font-semibold text-white tracking-wide">4.9/5 (1,240+ Reviews)</span>
            <span className="text-white/40">•</span>
            <span className="text-white/80">{serviceLocation === 'salon' ? '5-Star Pet Spa' : '5-Star Mobile Spa'}</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-white font-bold tracking-tight leading-tight">
              {serviceLocation === 'salon' 
                ? 'Stress-free luxury grooming in our premium salon.'
                : 'Stress-free luxury grooming right at your doorstep.'}
            </h1>
            <p className="font-body-md text-body-md text-surface-container-high/90 max-w-md">
              {serviceLocation === 'salon'
                ? "Experience our state-of-the-art spa environment. Handcrafted one-on-one care tailored precisely to your pet's needs."
                : "No cages, no frantic car rides, and zero multi-hour kennel stress. Handcrafted one-on-one care tailored precisely to your pet's needs."}
            </p>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="w-full lg:w-7/12 xl:w-[58%] lg:ml-auto min-h-screen bg-background flex flex-col justify-between">
        
        {/* Top Context Navigation */}
        <div className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 px-6 sm:px-10 py-4 flex items-center justify-between">
          <button onClick={() => {
            if (step === 6) {
              window.location.reload();
            } else if (step > 1) {
              handleBack(); 
            } else {
              navigate('/');
            }
          }} className="inline-flex items-center gap-2 font-label-md text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors duration-150">
            <span className="material-symbols-outlined text-lg">{step === 6 ? 'home' : 'arrow_back'}</span>
            <span>{step === 6 ? 'Start New Booking' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold tracking-wide">
              {step === 6 ? 'Booking Complete' : `Step ${step} of ${business?.requireUpfrontDeposit ? 5 : 4}: ${step === 1 ? 'Service Selection' : step === 2 ? 'Add-ons' : step === 3 ? 'Date & Time' : step === 4 ? 'Confirm' : 'Payment'}`}
            </span>
          </div>
        </div>

        <div className="px-6 sm:px-10 lg:px-12 py-8 space-y-8 max-w-4xl pb-32">
          
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              {/* Booking Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">1</span> Service</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">2</span> Add-ons</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">3</span> Date &amp; Time</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">4</span> Details</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{width: '25%'}}></div>
                </div>
              </div>

              {/* Section Header */}
              <div className="space-y-2">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Choose a Grooming Package for Your Dog</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {serviceLocation === 'salon' 
                    ? "Enjoy a premium spa experience at our professional grooming salon." 
                    : "All sessions are performed right in your driveway in our sanitized, climate-controlled mobile spa van."}
                </p>
              </div>

              {business?.businessType === 'both' && (
                <div className="space-y-3 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">store</span> Select Location Preference:
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => setServiceLocation('mobile')} type="button" className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-150 ${serviceLocation === 'mobile' ? 'border-2 border-primary bg-surface-container-high/60 shadow-sm ring-2 ring-primary/20' : 'border border-outline-variant/40 bg-surface hover:border-primary/50'}`}>
                      <span className={`font-headline-sm text-sm font-bold ${serviceLocation === 'mobile' ? 'text-primary' : 'text-on-surface'}`}>Mobile (At-Home)</span>
                    </button>
                    <button onClick={() => setServiceLocation('salon')} type="button" className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-150 ${serviceLocation === 'salon' ? 'border-2 border-primary bg-surface-container-high/60 shadow-sm ring-2 ring-primary/20' : 'border border-outline-variant/40 bg-surface hover:border-primary/50'}`}>
                      <span className={`font-headline-sm text-sm font-bold ${serviceLocation === 'salon' ? 'text-primary' : 'text-on-surface'}`}>At the Salon</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pet Weight Toggle Selector */}
              <div className="space-y-3 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">scale</span> Select Your Dog's Weight Range:
                  </label>
                  <span className="font-body-sm text-body-sm text-outline hidden sm:block">Determines bath time &amp; pricing</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {dogSizes.map(size => (
                    <button key={size.name} onClick={() => setPetSize(size.name)} type="button" className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-150 ${petSize === size.name ? 'border-2 border-primary bg-surface-container-high/60 shadow-sm ring-2 ring-primary/20' : 'border border-outline-variant/40 bg-surface hover:border-primary/50'}`}>
                      <span className={`font-headline-sm text-xs font-bold ${petSize === size.name ? 'text-primary' : 'text-on-surface'}`}>{size.name}</span>
                      <span className={`text-body-sm text-[11px] ${petSize === size.name ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{size.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Core Service Packages */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                    <span>Select Core Service</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">Required</span>
                  </h3>
                  <span className="text-xs font-medium text-outline">Choose one package</span>
                </div>
                
                {loadingServices && (
                  <div className="p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl text-center">
                    <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
                    <p className="text-on-surface-variant mt-2">Loading available services...</p>
                  </div>
                )}

                {!loadingServices && coreServices.length === 0 && !error && (
                  <div className="p-8 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl text-center space-y-2">
                    <span className="material-symbols-outlined text-outline text-4xl">pet_supplies</span>
                    <p className="text-on-surface font-semibold">No grooming services available yet.</p>
                    <p className="text-on-surface-variant text-sm">This business hasn't configured their service menu. Please check back later.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {coreServices.map((srv, idx) => {
                    const isSelected = selectedCore?.id === srv.id;
                    return (
                      <div key={srv.id} onClick={() => setSelectedCore(srv)} className={`relative group cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-150 ${isSelected ? 'bg-surface-container-lowest border-2 border-primary ring-1 ring-primary/30 shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/40 hover:border-outline-variant shadow-[0_1px_2px_rgba(15,23,42,0.04)]'}`}>
                        {idx === 0 && (
                           <div className="absolute -top-3 right-6 bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                             <span className="material-symbols-outlined text-xs" data-weight="fill">hotel_class</span> Most Popular
                           </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface text-transparent group-hover:border-primary'}`}>
                              <span className="material-symbols-outlined text-sm font-bold">check</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-headline-md text-headline-md font-bold text-on-surface">{srv.name}</h4>
                                <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-full">
                                  <span className="material-symbols-outlined text-xs text-outline">schedule</span> {srv.durationMinutes} mins duration
                                </span>
                              </div>
                              <p className="font-body-md text-body-md text-on-surface-variant">{srv.description}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">${srv.price}</span>
                            <span className="block text-body-sm text-outline">{petSize} dog rate</span>
                          </div>
                        </div>
                        {/* Included Elements Grid - shown when selected */}
                        {isSelected && (
                          <div className="mt-5 pt-4 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface font-medium">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Warm hydro-massage bath &amp; organic rinse</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Full haircut &amp; personalized breed styling</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Blow dry &amp; deep hand brush-out</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Nail trim &amp; smooth dremel buffing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Ear cleansing &amp; sanitary trim</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                              <span>Complimentary silk bandana &amp; spritz</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Appointment Assurance Callout */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3.5">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">verified</span>
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-on-surface">100% Satisfaction Guarantee</span>
                  <p className="text-on-surface-variant">
                    Every groom is verified with you in your driveway before our mobile van departs. No upfront charge—we take payment upon completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Service</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">2</span> Add-ons</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">3</span> Date &amp; Time</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">4</span> Details</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{width: '50%'}}></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Optional Spa Upgrades &amp; Add-ons</h3>
                    <p className="font-body-sm text-body-sm text-outline">Customize your dog's appointment with gentle, therapeutic treatments</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {addons.map(addon => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <label key={addon.id} className={`relative flex items-start gap-3.5 p-4 rounded-xl cursor-pointer shadow-sm transition-all duration-150 ${isSelected ? 'border-2 border-primary bg-surface-container-high/40' : 'border border-outline-variant/40 bg-surface-container-lowest hover:border-outline-variant'}`}>
                        <input checked={isSelected} onChange={(e) => {
                          if (e.target.checked) setSelectedAddons([...selectedAddons, addon]);
                          else setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
                        }} className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary/20 border-primary" type="checkbox"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-headline-sm text-sm font-bold text-on-surface">{addon.name}</span>
                            <span className="font-mono-data text-sm font-bold text-primary">+${addon.price}</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant mt-0.5 leading-snug">{addon.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Service</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Add-ons</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">3</span> Date &amp; Time</span>
                  <span className="text-outline flex items-center gap-1.5 opacity-60"><span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[11px]">4</span> Details</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{width: '75%'}}></div>
                </div>
              </div>

              <div>
                <label className="block font-label-md font-semibold text-on-surface mb-2">Select Date</label>
                <input 
                  type="date" 
                  value={format(selectedDate, 'yyyy-MM-dd')} 
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(y, m - 1, d));
                  }} 
                  min={format(new Date(), 'yyyy-MM-dd')} 
                  className="w-full p-4 border border-outline-variant/40 rounded-xl focus:ring-primary focus:border-primary bg-surface-container-lowest" 
                />
              </div>

              <div>
                <label className="block font-label-md font-semibold text-on-surface mb-2">Available Times</label>
                {availableSlots.length === 0 ? (
                  <p className="text-on-surface-variant text-center py-4">No slots available on this date.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot, i) => {
                      const slotDate = slot instanceof Date ? slot : new Date(slot);
                      const isSelected = selectedTime && (selectedTime instanceof Date ? selectedTime.getTime() : new Date(selectedTime).getTime()) === slotDate.getTime();
                      return (
                        <button key={i} onClick={() => setSelectedTime(slotDate)} className={`py-3 rounded-xl border font-medium transition-all duration-150 ${isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:border-primary'}`}>
                          {format(slotDate, 'h:mm a')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {selectedTime && (
                <div className="pt-4 border-t border-outline-variant/30 mt-6 animate-fade-in">
                  <label className="block font-label-md font-semibold text-on-surface mb-3">Make it recurring?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => setRecurringFrequency(0)} className={`py-3 rounded-xl border font-medium transition-all duration-150 ${recurringFrequency === 0 ? 'bg-secondary text-on-secondary border-secondary shadow-md' : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:border-secondary'}`}>
                      Just Once
                    </button>
                    <button onClick={() => setRecurringFrequency(4)} className={`py-3 rounded-xl border font-medium transition-all duration-150 ${recurringFrequency === 4 ? 'bg-secondary text-on-secondary border-secondary shadow-md' : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:border-secondary'}`}>
                      Every 4 Weeks
                    </button>
                    <button onClick={() => setRecurringFrequency(6)} className={`py-3 rounded-xl border font-medium transition-all duration-150 ${recurringFrequency === 6 ? 'bg-secondary text-on-secondary border-secondary shadow-md' : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:border-secondary'}`}>
                      Every 6 Weeks
                    </button>
                    <button onClick={() => setRecurringFrequency(8)} className={`py-3 rounded-xl border font-medium transition-all duration-150 ${recurringFrequency === 8 ? 'bg-secondary text-on-secondary border-secondary shadow-md' : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:border-secondary'}`}>
                      Every 8 Weeks
                    </button>
                  </div>
                  {recurringFrequency > 0 && (
                    <p className="text-sm text-on-surface-variant mt-3 text-center">
                      We will automatically generate your next 6 appointments spaced {recurringFrequency} weeks apart.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleDetailsSubmit} className="space-y-8 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Service</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Add-ons</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Date &amp; Time</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">4</span> {business?.requireUpfrontDeposit ? 'Details' : 'Confirm'}</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{width: business?.requireUpfrontDeposit ? '85%' : '100%'}}></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Client Info</h3>
                <input required type="text" placeholder="Full Name" value={clientDetails.name} onChange={e => setClientDetails({...clientDetails, name: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                <input required type="tel" placeholder="Phone Number" value={clientDetails.phone} onChange={e => setClientDetails({...clientDetails, phone: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                <input type="email" placeholder="Email (Optional)" value={clientDetails.email} onChange={e => setClientDetails({...clientDetails, email: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                {serviceLocation === 'mobile' && (
                  <input required type="text" placeholder="Home Address (For mobile service)" value={clientDetails.address} onChange={e => setClientDetails({...clientDetails, address: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Pet Info</h3>
                <input required type="text" placeholder="Pet's Name" value={petDetails.name} onChange={e => setPetDetails({...petDetails, name: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1 font-medium">Breed</label>
                  <select required value={petDetails.breed} onChange={e => setPetDetails({...petDetails, breed: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary">
                    <option value="" disabled>Select Breed</option>
                    <option value="Mixed / Mutt">Mixed / Mutt</option>
                    <option value="Golden Retriever">Golden Retriever</option>
                    <option value="Labrador Retriever">Labrador Retriever</option>
                    <option value="French Bulldog">French Bulldog</option>
                    <option value="Poodle">Poodle (Toy / Mini / Standard)</option>
                    <option value="Doodle">Doodle (Goldendoodle / Labradoodle etc)</option>
                    <option value="German Shepherd">German Shepherd</option>
                    <option value="Bulldog">Bulldog</option>
                    <option value="Beagle">Beagle</option>
                    <option value="Rottweiler">Rottweiler</option>
                    <option value="Dachshund">Dachshund</option>
                    <option value="Corgi">Corgi</option>
                    <option value="Husky">Husky</option>
                    <option value="Yorkshire Terrier">Yorkshire Terrier</option>
                    <option value="Boxer">Boxer</option>
                    <option value="Shih Tzu">Shih Tzu</option>
                    <option value="Pomeranian">Pomeranian</option>
                    <option value="Schnauzer">Schnauzer</option>
                    <option value="Chihuahua">Chihuahua</option>
                    <option value="Pug">Pug</option>
                    <option value="Other">Other / Not Listed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1 font-medium">Temperament</label>
                  <select value={petDetails.temperament} onChange={e => setPetDetails({...petDetails, temperament: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary">
                    <option value="Friendly">Friendly</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1 font-medium">Rabies Vaccine Expiration Date *</label>
                  <input type="date" required value={petDetails.rabiesExpiration || ''} onChange={e => setPetDetails({...petDetails, rabiesExpiration: e.target.value})} className="w-full p-4 border border-outline-variant/40 rounded-xl bg-surface-container-lowest focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-surface-container rounded-xl border border-outline-variant/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-outline" />
                  <span className="text-sm text-on-surface-variant leading-tight">
                    I agree to the <a href="#" className="text-primary font-semibold hover:underline">Terms & Conditions</a> and <a href="#" className="text-primary font-semibold hover:underline">Liability Waiver</a>. I certify that my pet's vaccinations are up to date and they are in good health for grooming.
                  </span>
                </label>
              </div>

              {error && <div className="text-error mb-4 mt-4 font-medium">{error}</div>}
              
              <button type="submit" disabled={submitting} className="w-full px-8 py-4 mt-6 rounded-xl bg-primary text-white font-headline-sm text-sm font-semibold tracking-wide hover:bg-primary-container active:scale-[0.99] transition-all duration-150 shadow-md flex items-center justify-center gap-2">
                {submitting ? 'Processing...' : (business?.requireUpfrontDeposit ? 'Proceed to Deposit' : 'Confirm & Request Booking')}
              </button>
            </form>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Service</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Add-ons</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Date &amp; Time</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">✓</span> Details</span>
                  <span className="text-primary flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">5</span> Deposit</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{width: '100%'}}></div>
                </div>
              </div>

              <div className="text-center space-y-2 mb-6">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Secure Your Appointment</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">A non-refundable deposit of ${business?.depositAmount || 35} is required.</p>
              </div>

              {business?.depositMethod === 'manual' ? (
                <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-on-surface mb-2">Payment Instructions</h3>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 text-sm text-on-surface font-medium leading-relaxed whitespace-pre-wrap">
                        {business?.manualDepositInstructions || "Please submit your payment to the groomer directly to secure this slot."}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); executeBooking(); }}>
                    <label className="flex items-start gap-3 cursor-pointer bg-surface-container-highest p-4 rounded-xl mb-6 border border-outline-variant/30 hover:border-primary/50 transition-colors">
                      <input type="checkbox" required className="mt-0.5 w-5 h-5 rounded text-primary focus:ring-primary border-outline" />
                      <span className="text-sm font-medium text-on-surface">
                        I confirm that I will send the ${business?.depositAmount || 35} deposit. I understand my appointment is <span className="font-bold text-amber-600">PENDING</span> until payment is received.
                      </span>
                    </label>

                    {error && <div className="text-error mb-4 font-medium">{error}</div>}
                    
                    <button type="submit" disabled={submitting} className="w-full px-8 py-4 rounded-xl bg-primary text-white font-headline-sm text-sm font-semibold tracking-wide hover:bg-primary-container active:scale-[0.99] transition-all duration-150 shadow-md">
                      {submitting ? 'Processing...' : 'I have sent the deposit - Complete Booking'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-on-surface">Pay with Card</h3>
                    <div className="flex gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xl">credit_card</span>
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </div>
                  </div>

                  {/* Mock Stripe Elements UI */}
                  <form onSubmit={(e) => { e.preventDefault(); executeBooking(); }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Card Information</label>
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-inner">
                        <input required type="text" placeholder="Card number" className="w-full p-3 border-b border-outline-variant/50 bg-transparent focus:outline-none" />
                        <div className="flex">
                          <input required type="text" placeholder="MM / YY" className="w-1/2 p-3 border-r border-outline-variant/50 bg-transparent focus:outline-none" />
                          <input required type="text" placeholder="CVC" className="w-1/2 p-3 bg-transparent focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Name on card</label>
                      <input required type="text" defaultValue={clientDetails.name} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:outline-none" />
                    </div>

                    {error && <div className="text-error mb-4 font-medium">{error}</div>}

                    <button type="submit" disabled={submitting} className="w-full px-8 py-4 mt-2 rounded-xl bg-[#635BFF] text-white font-headline-sm text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all duration-150 shadow-md flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">lock</span>
                      {submitting ? 'Processing...' : `Pay $${business?.depositAmount || 35} securely`}
                    </button>
                    <p className="text-center text-xs text-on-surface-variant font-medium mt-3 flex items-center justify-center gap-1">
                      Powered by <span className="font-bold">Stripe</span>
                    </p>
                  </form>
                </div>
              )}
            </div>
          )}

          {step === 6 && (() => {
            const isAutoApproved = business?.autoApproveAppointments;
            return (
            <div className="animate-fade-in min-h-[70vh] flex flex-col">
              {/* Success Header */}
              <div className="relative bg-gradient-to-br from-primary/5 via-secondary-container/20 to-primary/5 rounded-3xl p-8 sm:p-10 text-center mb-8 overflow-hidden">
                {/* Decorative dots */}
                <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-primary/30 animate-pulse"></div>
                <div className="absolute top-12 right-12 w-3 h-3 rounded-full bg-secondary/20 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-6 left-16 w-2.5 h-2.5 rounded-full bg-primary/20 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-10 right-20 w-2 h-2 rounded-full bg-secondary/30 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 ${isAutoApproved ? 'bg-secondary-container text-secondary ring-secondary/10' : 'bg-primary-container text-primary ring-primary/10'} rounded-full flex items-center justify-center shadow-lg mx-auto mb-5 ring-4`}>
                    <span className="material-symbols-outlined text-4xl" data-weight="fill">{isAutoApproved ? 'check_circle' : 'schedule_send'}</span>
                  </div>
                  <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface mb-2 tracking-tight">
                    {isAutoApproved ? 'Booking Confirmed!' : 'Booking Submitted!'}
                  </h2>
                  <p className="text-on-surface-variant max-w-sm mx-auto text-sm leading-relaxed">
                    {isAutoApproved 
                      ? 'Your appointment has been confirmed automatically.' 
                      : 'Your appointment is pending. The groomer will review and confirm shortly.'}
                    {clientDetails.email && <> A confirmation email has been sent to <span className="font-semibold text-on-surface">{clientDetails.email}</span>.</>}
                  </p>
                </div>
              </div>

              {/* Receipt Card */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden mb-6">
                <div className="bg-surface-container px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
                  <h3 className="font-headline-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                    Appointment Summary
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${isAutoApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {isAutoApproved ? 'Confirmed' : 'Pending Review'}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/20">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-2xl">pets</span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{petDetails.name}</p>
                      <p className="text-xs text-on-surface-variant">{petDetails.breed || 'Dog'} &bull; {petSize}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Service</span>
                      <p className="font-semibold text-on-surface">{selectedCore?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Total</span>
                      <p className="font-bold text-on-surface text-lg">${totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Date</span>
                      <p className="font-semibold text-on-surface">{selectedTime && format(selectedTime, 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Time</span>
                      <p className="font-semibold text-on-surface">{selectedTime && format(selectedTime, 'h:mm a')} &ndash; {selectedTime && format(new Date(selectedTime.getTime() + totalDuration * 60000), 'h:mm a')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Location</span>
                      <p className="font-semibold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">{serviceLocation === 'salon' ? 'store' : 'home'}</span>
                        {serviceLocation === 'salon' ? 'At the Salon' : 'At-Home Service'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Deposit</span>
                      <p className={`font-semibold text-xs px-2 py-1 rounded-md inline-block ${business?.requireUpfrontDeposit ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {business?.requireUpfrontDeposit ? 'Deposit Required' : 'No Deposit Required'}
                      </p>
                    </div>
                  </div>

                  {selectedAddons.length > 0 && (
                    <div className="pt-3 border-t border-outline-variant/20">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Add-ons Included</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAddons.map(a => (
                          <span key={a.id} className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-medium text-on-surface-variant">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 mb-8">
                <h4 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">info</span>
                  What happens next?
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Review &amp; Confirm</span> &mdash; The groomer will review your booking and send you a confirmation email.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/70 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Appointment Day</span> &mdash; {serviceLocation === 'salon' ? 'Arrive at the salon at your scheduled time.' : 'Be home at the scheduled time. The groomer will arrive at your door.'}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/50 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p className="text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Happy Pet!</span> &mdash; Your furry friend gets pampered with professional care.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <button onClick={() => window.location.reload()} className="flex-1 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Book Another Session
                </button>
                <button onClick={() => navigate('/')} className="flex-1 px-6 py-3.5 bg-surface-container text-on-surface rounded-xl font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">home</span>
                  Back to Home
                </button>
              </div>
            </div>
            );
          })()}

        </div>

        {/* STICKY BOTTOM SUMMARY BAR */}
        {step < 4 && step > 0 && (
          <footer className="sticky bottom-0 z-40 bg-surface-container-lowest border-t border-outline-variant/30 px-6 sm:px-10 py-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-lg">
            <div className="max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-on-surface-variant">
                  {selectedCore && (
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-primary font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">pets</span> {selectedCore.name} (${selectedCore.price})
                    </span>
                  )}
                  {selectedAddons.map(a => (
                    <span key={a.id} className="px-2.5 py-1 rounded-md bg-surface-container-high/60 text-on-surface">
                      + {a.name} (${a.price})
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-outline font-medium">Total:</span>
                    <span className="font-display-lg text-2xl font-extrabold text-on-surface tracking-tight">${totalPrice.toFixed(2)}</span>
                  </div>
                  <span className="text-outline/40">•</span>
                  <span className="text-xs font-medium text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span> Est. Duration: {totalDuration} mins
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end w-full md:w-auto">
                <button 
                  disabled={!selectedCore || (step === 3 && !selectedTime)}
                  onClick={handleNext}
                  className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-headline-sm text-sm font-semibold tracking-wide hover:bg-primary-container active:scale-[0.99] transition-all duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
                  <span>Continue to {step === 1 ? 'Add-ons' : step === 2 ? 'Time' : 'Details'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
