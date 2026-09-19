import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('mobile'); // mobile, salon, both
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError((isSignUp ? 'Failed to sign up: ' : 'Failed to log in: ') + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          {isSignUp ? 'Create Business Account' : 'Admin Login'}
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {isSignUp && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">Business Name</label>
              <input 
                type="text" 
                required 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">Business Type</label>
              <select 
                value={businessType} 
                onChange={e => setBusinessType(e.target.value)} 
                className="w-full p-2 border rounded bg-white text-gray-900"
              >
                <option value="mobile">Mobile Groomer</option>
                <option value="salon">Salon Shop</option>
                <option value="both">Both</option>
              </select>
            </div>
          </>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded mb-4">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
        <div className="text-center">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-sm text-purple-600 hover:underline"
          >
            {isSignUp ? 'Already have an account? Log In' : 'New groomer? Create an account'}
          </button>
        </div>
      </form>
    </div>
  );
}
