import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import PetCrew from '../../components/auth/PetCrew/PetCrew';

export default function Login() {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('mobile'); // mobile, salon, both
  const [error, setError] = useState('');

  const [focusedField, setFocusedField] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 1. Create Business Document
        const autoApproveAppointments = businessType === 'salon';
        const businessPayload = {
          businessName,
          name: businessName,
          businessType,
          autoApproveAppointments,
          email,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'businesses', user.uid), businessPayload);

        // 2. Create User Document
        await setDoc(doc(db, 'users', user.uid), {
          email,
          role: 'owner',
          businessId: user.uid,
          businessName,
          createdAt: new Date().toISOString()
        });

        // 3. Seed Data: Auto-populate default services
        const { writeBatch, collection } = await import('firebase/firestore');
        const batch = writeBatch(db);
        
        const defaultServices = [
          { name: "Full Groom - Small Dog", description: "Bath, haircut, nail trim, ear cleaning for dogs under 20lbs.", price: 65, durationMinutes: 90, type: "core", isActive: true },
          { name: "Full Groom - Medium Dog", description: "Bath, haircut, nail trim, ear cleaning for dogs 20-50lbs.", price: 85, durationMinutes: 120, type: "core", isActive: true },
          { name: "Bath & Brush", description: "Shampoo, blowout, and thorough brush out.", price: 45, durationMinutes: 60, type: "core", isActive: true },
          { name: "Deluxe Spa Package", description: "Blueberry facial, upgraded premium shampoo, and paw balm.", price: 25, durationMinutes: 15, type: "package_addon", isActive: true },
          { name: "De-Shedding Treatment", description: "Specialized shampoo and extra brushing to reduce shedding.", price: 20, durationMinutes: 30, type: "package_addon", isActive: true },
          { name: "Teeth Brushing", description: "Enzymatic toothpaste and breath freshener.", price: 10, durationMinutes: 5, type: "single_addon", isActive: true },
          { name: "Nail Grinding", description: "Smooth filing of nails after trimming.", price: 15, durationMinutes: 10, type: "single_addon", isActive: true }
        ];

        const servicesRef = collection(db, 'services');
        defaultServices.forEach(service => {
          const newDocRef = doc(servicesRef); // Auto-generate ID
          batch.set(newDocRef, { ...service, businessId: user.uid });
        });
        
        await batch.commit();
        setStatus('success');
      } else {
        await login(email, password);
        setStatus('success');
      }
    } catch (err) {
      setError((isSignUp ? 'Failed to sign up: ' : 'Failed to log in: ') + err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[1100px] min-h-[620px] bg-surface rounded-3xl overflow-hidden shadow-lg flex flex-col lg:grid lg:grid-cols-[58%_42%]">
        
        {/* Left Panel: Pet Crew */}
        <div className="bg-surface-container relative hidden min-[640px]:block lg:block h-44 lg:h-auto shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant">
          <PetCrew 
            focusedField={focusedField} 
            passwordVisible={passwordVisible} 
            status={status} 
            // On desktop: 65% width centered. On mobile: full width scaled down.
            className="w-full lg:w-[65%] mx-auto scale-75 lg:scale-100 origin-bottom" 
          />
        </div>

        {/* Right Panel: Form */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-[310px]">
            <h2 className="text-2xl font-bold mb-6 text-center text-on-surface">
              {isSignUp ? 'Create Business Account' : 'Admin Login'}
            </h2>
            
            {error && <p className="text-error text-sm mb-4 font-medium">{error}</p>}
            
            {isSignUp && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-on-surface-variant">Business Name</label>
                  <input 
                    type="text" 
                    required 
                    value={businessName} 
                    onChange={e => { setBusinessName(e.target.value); setStatus('idle'); }} 
                    onFocus={() => setFocusedField('business')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-on-surface-variant">Business Type</label>
                  <select 
                    value={businessType} 
                    onChange={e => { setBusinessType(e.target.value); setStatus('idle'); }} 
                    onFocus={() => setFocusedField('type')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="mobile">Mobile Groomer</option>
                    <option value="salon">Salon Shop</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-on-surface-variant">Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => { setEmail(e.target.value); setStatus('idle'); }} 
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" 
              />
            </div>
            
            <div className="mb-6 relative">
              <label className="block text-sm font-medium mb-1 text-on-surface-variant">Password</label>
              <div className="relative">
                <input 
                  type={passwordVisible ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={e => { setPassword(e.target.value); setStatus('idle'); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full p-3 pr-10 border border-outline-variant rounded-xl bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none" 
                />
                <button
                  type="button"
                  tabIndex="-1"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface flex items-center"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {passwordVisible ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl mb-4 hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-70"
            >
              {status === 'submitting' ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </button>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setStatus('idle'); setError(''); }} 
                className="text-sm text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Already have an account? Log In' : 'New groomer? Create an account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
