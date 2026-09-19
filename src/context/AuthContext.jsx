import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
          let businessData = {};
          try {
            const bizDoc = await getDoc(doc(db, 'businesses', user.uid));
            if (bizDoc.exists()) {
              businessData = bizDoc.data();
            }
          } catch (e) {
            console.error("Error fetching business document:", e);
          }

          const baseProfile = {
            businessId: user.uid,
            role: 'owner',
            businessName: businessData.businessName || businessData.name || 'My Business',
            ...businessData
          };

          if (profileDoc.exists()) {
            setUserProfile({ ...baseProfile, ...profileDoc.data() });
          } else {
            setUserProfile(baseProfile);
          }
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
