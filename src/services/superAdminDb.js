import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export const getAllBusinesses = async () => {
  const snapshot = await getDocs(collection(db, 'businesses'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
