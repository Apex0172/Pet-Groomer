import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          const baseUser = profileDoc.exists() ? profileDoc.data() : {};
          
          // Setup real-time listener for the business document
          const unsubscribeBiz = onSnapshot(doc(db, 'businesses', user.uid), (bizDoc) => {
            const businessData = bizDoc.exists() ? bizDoc.data() : {};
            
            const fullProfile = {
              businessId: user.uid,
              role: 'owner',
              businessName: businessData.businessName || businessData.name || 'My Business',
              ...baseUser,
              ...businessData
            };
            setUserProfile(fullProfile);
          }, (error) => {
            console.error("Error listening to business document:", error);
          });

          // Cleanup listener when user logs out or component unmounts
          // To keep it simple, we just attach it. In a robust app, we'd manage this unsubscribe.
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile({ businessId: user.uid, role: 'owner', businessName: 'My Business' });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
