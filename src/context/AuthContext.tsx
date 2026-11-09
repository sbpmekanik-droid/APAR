import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_DEMO_USERS } from '../utils/seedData';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isInspector: boolean;
  loading: boolean;
  loginAs: (role: UserRole, customName?: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  createFirstAdminAccount: (name: string, email: string, pass: string) => Promise<boolean>;
  usersList: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'hse_apar_current_user';
const LOCAL_STORAGE_USERS_KEY = 'hse_apar_users_list';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_DEMO_USERS;
  });

  // Sync users list to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersList));
  }, [usersList]);

  // Initial load
  useEffect(() => {
    // 1. Check local storage session first
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    } else {
      // Default to demo admin for seamless out-of-the-box exploration
      setCurrentUser(INITIAL_DEMO_USERS[0]);
    }

    // 2. Attach Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Attempt to load from Firestore
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data));
          } else {
            // New user, determine role (admin if matching email or first user)
            const isDefaultAdmin = fbUser.email === 'sbpmekanik@gmail.com' || usersList.length === 0;
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || 'user@vbelt.hse.id',
              name: fbUser.displayName || (isDefaultAdmin ? 'Admin HSE' : 'Petugas HSE'),
              role: isDefaultAdmin ? 'admin' : 'inspector',
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Could not sync user with Firestore, using fallback state:', err);
        }
      }
      setLoading(false);
    });

    // 3. Live real-time sync for users collection across all devices
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (!snap.empty) {
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push(d.data() as UserProfile));
        setUsersList(list);
      }
    }, (err) => console.warn('Users live sync notice:', err));

    return () => {
      unsubscribe();
      unsubUsers();
    };
  }, []);

  const loginAs = (role: UserRole, customName?: string) => {
    const existing = usersList.find(u => u.role === role && u.isActive);
    const selected: UserProfile = existing || {
      id: `usr_${role}_${Date.now()}`,
      email: `${role}@vbelt.hse.id`,
      name: customName || (role === 'admin' ? 'Budi Santoso, S.T. (HSE Manager)' : 'Rian Pratama (Petugas Lapangan)'),
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(selected);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(selected));
  };

  const loginWithCredentials = async (identifier: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = identifier.trim().toLowerCase();
    
    // Check against users list
    const found = usersList.find(u => 
      u.email.toLowerCase() === trimmed || 
      u.name.toLowerCase().includes(trimmed)
    );

    if (!found) {
      return { success: false, message: 'Akun tidak ditemukan. Periksa email/username Anda.' };
    }

    if (!found.isActive) {
      return { success: false, message: 'Akun ini berstatus non-aktif. Hubungi HSE Manager.' };
    }

    // Realistic password check
    if (pass.length < 4) {
      return { success: false, message: 'Password minimal 4 karakter.' };
    }

    setCurrentUser(found);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(found));
    return { success: true };
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      handleFirestoreError(error, OperationType.GET, 'auth/google');
    }
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));

    // Also update in usersList
    setUsersList(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    // Update in Firestore if firebase user
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.id), updated, { merge: true });
      } catch (e) {
        console.warn('Firestore update failed, kept in local state:', e);
      }
    }
  };

  const createFirstAdminAccount = async (name: string, email: string, _pass: string): Promise<boolean> => {
    const newAdmin: UserProfile = {
      id: `usr_admin_${Date.now()}`,
      email,
      name,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updatedList = [newAdmin, ...usersList.filter(u => u.email !== email)];
    setUsersList(updatedList);
    setCurrentUser(newAdmin);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newAdmin));
    return true;
  };

  const addUser = async (user: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newUser: UserProfile = {
      ...user,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsersList(prev => [...prev, newUser]);
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e) {
      console.warn('Failed to sync new user to Firestore:', e);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, isActive: !u.isActive };
        setDoc(doc(db, 'users', userId), updated, { merge: true }).catch(console.warn);
        return updated;
      }
      return u;
    }));
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, role };
        setDoc(doc(db, 'users', userId), updated, { merge: true }).catch(console.warn);
        return updated;
      }
      return u;
    }));
  };

  const deleteUser = async (userId: string) => {
    setUsersList(prev => prev.filter(u => u.id !== userId));
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('User deleted locally, Firestore note:', e);
    }
    if (currentUser?.id === userId) {
      await logout();
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isInspector = currentUser?.role === 'inspector';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAdmin,
        isInspector,
        loading,
        loginAs,
        loginWithGoogle,
        loginWithCredentials,
        logout,
        updateProfileData,
        createFirstAdminAccount,
        usersList,
        addUser,
        toggleUserStatus,
        updateUserRole,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
