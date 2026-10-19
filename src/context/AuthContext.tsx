import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, testFirestoreConnection } from '../firebase';
import { INITIAL_HR_SETTINGS } from '../data/seedData';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAuthorizedHr: boolean;
  role: 'HR Director' | 'HR Compliance Officer' | 'HR Operations Specialist';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInDemoHr: (role?: 'HR Director' | 'HR Compliance Officer') => void;
  logout: () => Promise<void>;
  isFirestoreConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed HR emails including user email from metadata
const AUTHORIZED_EMAILS = [
  'isaamiu@gmail.com',
  'hr.admin@kooddoo.mv',
  'compliance@kfc.mv',
  'hr.director@kooddoo.mv',
  'mifco.hr@kooddoo.mv',
  ...INITIAL_HR_SETTINGS.authorizedHrEmails,
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  useEffect(() => {
    // Validate connection
    testFirestoreConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase();
        // Check if authorized
        const isAuthorized = AUTHORIZED_EMAILS.some((e) => e.toLowerCase() === email) || email.endsWith('@kfc.mv') || email.endsWith('@kooddoo.mv');

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'KFC HR Staff',
          photoURL: firebaseUser.photoURL,
          isAuthorizedHr: isAuthorized,
          role: 'HR Director',
        });
      } else {
        // Check if demo session was stored in sessionStorage for evaluation
        const storedDemo = sessionStorage.getItem('kfc_demo_hr_user');
        if (storedDemo) {
          try {
            setUser(JSON.parse(storedDemo));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const email = (cred.user.email || '').toLowerCase();
      const isAuthorized = AUTHORIZED_EMAILS.some((e) => e.toLowerCase() === email) || email.endsWith('@kfc.mv') || email.endsWith('@kooddoo.mv');

      if (!isAuthorized) {
        // Warning: unauthorized HR portal access
        setError(`Access Denied: The Google account (${cred.user.email}) is not authorized for Kooddoo Fisheries Complex HR portal. Please sign in with an authorized HR email or use Demo HR Access.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      console.error('Google Sign-In Error:', err);
      setError(`Sign in failed: ${msg}`);
    }
  };

  const signInDemoHr = (role: 'HR Director' | 'HR Compliance Officer' = 'HR Director') => {
    const demoUser: AuthUser = {
      uid: 'kfc-hr-demo-officer',
      email: 'isaamiu@gmail.com', // Match the project owner for full authorization
      displayName: role === 'HR Director' ? 'Mariyam Rishfa (HR Director)' : 'Aminath Leena (HR Officer)',
      photoURL: null,
      isAuthorizedHr: true,
      role,
    };
    sessionStorage.setItem('kfc_demo_hr_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setError(null);
  };

  const logout = async () => {
    sessionStorage.removeItem('kfc_demo_hr_user');
    await signOut(auth);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInDemoHr,
        logout,
        isFirestoreConnected,
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
