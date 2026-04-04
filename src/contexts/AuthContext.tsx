'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'customer' | null;
  profile: {
    first_name?: string;
    last_name?: string;
    email?: string;
    admin_type?: 'superadmin' | 'admin';
    status?: 'active' | 'inactive';
  } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    admin_type?: 'superadmin' | 'admin';
    status?: 'active' | 'inactive';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        if (db) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.role);
            setProfile({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email ?? user.email ?? undefined,
              admin_type: data.admin_type,
              status: data.status,
            });
          } else {
            setRole(null);
            setProfile({
              email: user.email ?? undefined,
            });
          }
        }
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
