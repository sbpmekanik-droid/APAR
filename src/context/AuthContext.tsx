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
  updateUser: (userId: string, data: Partial<UserProfile>) => Promise<void>;
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

// Helper to sanitize undefined values for Firestore
const cleanData = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanData);
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = cleanData(value);
      }
    }
    return result;
  }
  return obj;
};

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
      // On a new device, require login - do not auto-login to default demo user
      setCurrentUser(null);
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
              password: 'password123',
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, cleanData(newProfile));
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
    const unsubUsers = onSnapshot(collection(db, 'users'), async (snap) => {
      if (!snap.empty) {
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push(d.data() as UserProfile));

        // Ensure Master Admin always exists in the active database list
        const hasMasterAdmin = list.some(u => 
          (u.email && u.email.toLowerCase() === 'admin@vbelt.hse.id') || 
          (u.name && u.name.toLowerCase() === 'admin')
        );
        if (!hasMasterAdmin) {
          const masterAdmin = INITIAL_DEMO_USERS[0]; // usr_master_admin
          try {
            await setDoc(doc(db, 'users', masterAdmin.id), cleanData(masterAdmin));
          } catch (e) {
            console.warn(e);
          }
          list.unshift(masterAdmin);
        }

        setUsersList(list);

        // Keep active session in sync with updated profile in Firestore
        const savedSession = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (savedSession) {
          try {
            const currentSaved = JSON.parse(savedSession);
            const liveMatch = list.find(u => u.id === currentSaved.id);
            if (liveMatch) {
              setCurrentUser(liveMatch);
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(liveMatch));
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        // If Firestore users collection is currently empty, seed initial users so all devices share them
        try {
          for (const u of INITIAL_DEMO_USERS) {
            await setDoc(doc(db, 'users', u.id), cleanData(u));
          }
        } catch (err) {
          console.warn('Could not seed initial users to Firestore:', err);
        }
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
      password: '123456',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(selected);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(selected));
  };

  const loginWithCredentials = async (identifier: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = identifier.trim().toLowerCase();

    // 1. MASTER ADMIN SPECIAL HANDLER: user "Admin" or "admin@vbelt.hse.id" with password "admin123"
    if ((trimmed === 'admin' || trimmed === 'admin@vbelt.hse.id') && pass === 'admin123') {
      const existingMaster = usersList.find(u => 
        (u.email && u.email.toLowerCase() === 'admin@vbelt.hse.id') || 
        (u.name && u.name.toLowerCase() === 'admin')
      );

      const masterProfile: UserProfile = existingMaster || {
        id: 'usr_master_admin',
        email: 'admin@vbelt.hse.id',
        name: 'Admin',
        role: 'admin',
        password: 'admin123',
        department: 'HSE & Safety Management',
        phone: '0812-3456-7890',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      };

      // Persist to Firestore to guarantee sync across all devices
      try {
        await setDoc(doc(db, 'users', masterProfile.id), cleanData(masterProfile), { merge: true });
      } catch (err) {
        console.warn('Master admin sync warning:', err);
      }

      setCurrentUser(masterProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(masterProfile));
      return { success: true };
    }

    // 2. Normal check against live users list synchronized from Firestore
    const found = usersList.find(u => 
      u.email.toLowerCase() === trimmed || 
      u.name.toLowerCase() === trimmed ||
      u.name.toLowerCase().includes(trimmed)
    );

    if (!found) {
      return { 
        success: false, 
        message: 'Akun tidak ditemukan. Gunakan Master Admin (User: Admin / Sandi: admin123) atau email terdaftar.' 
      };
    }

    if (!found.isActive) {
      return { success: false, message: 'Akun ini berstatus non-aktif. Hubungi HSE Manager.' };
    }

    // Password validation against stored account (or master password override for admin)
    const expectedPassword = found.password || '123456';
    const isMasterPassword = found.role === 'admin' && pass === 'admin123';
    
    if (pass !== expectedPassword && !isMasterPassword) {
      return { 
        success: false, 
        message: 'Kata sandi (password) salah. Masukkan kata sandi yang sesuai atau gunakan master admin.' 
      };
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
    const updated: UserProfile = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));

    // Update locally in usersList
    setUsersList(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    // Sync to Firestore immediately so all devices receive the updated account
    try {
      await setDoc(doc(db, 'users', currentUser.id), cleanData(updated), { merge: true });
    } catch (e) {
      console.warn('Firestore user profile sync failed:', e);
    }
  };

  const updateUser = async (userId: string, data: Partial<UserProfile>) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    try {
      await setDoc(doc(db, 'users', userId), cleanData(data), { merge: true });
    } catch (e) {
      console.warn('Failed to update user in Firestore:', e);
    }
    if (currentUser?.id === userId) {
      const updatedSelf = { ...currentUser, ...data };
      setCurrentUser(updatedSelf);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedSelf));
    }
  };

  const createFirstAdminAccount = async (name: string, email: string, pass: string): Promise<boolean> => {
    const newAdmin: UserProfile = {
      id: `usr_admin_${Date.now()}`,
      email,
      name,
      role: 'admin',
      password: pass,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updatedList = [newAdmin, ...usersList.filter(u => u.email !== email)];
    setUsersList(updatedList);
    setCurrentUser(newAdmin);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newAdmin));
    try {
      await setDoc(doc(db, 'users', newAdmin.id), cleanData(newAdmin));
    } catch (e) {
      console.warn('Failed to sync new admin to Firestore:', e);
    }
    return true;
  };

  const addUser = async (user: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newUser: UserProfile = {
      ...user,
      id: `usr_${Date.now()}`,
      password: user.password || '123456',
      createdAt: new Date().toISOString(),
    };
    setUsersList(prev => [...prev, newUser]);
    try {
      await setDoc(doc(db, 'users', newUser.id), cleanData(newUser));
    } catch (e) {
      console.warn('Failed to sync new user to Firestore:', e);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const targetUser = usersList.find(u => u.id === userId);
    if (!targetUser) return;
    const newStatus = !targetUser.isActive;
    
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: newStatus };
      }
      return u;
    }));

    try {
      await setDoc(doc(db, 'users', userId), { isActive: newStatus }, { merge: true });
    } catch (e) {
      console.warn('Failed to toggle user status in Firestore:', e);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role };
      }
      return u;
    }));

    try {
      await setDoc(doc(db, 'users', userId), { role }, { merge: true });
    } catch (e) {
      console.warn('Failed to update user role in Firestore:', e);
    }
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
        updateUser,
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
