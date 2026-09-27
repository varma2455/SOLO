// -------------------------------------------------------------
// SHADOW ASCENSION - DEDICATED ADMIN AUTHENTICATION CONTEXT
// Restricts Firebase Authentication solely to authorized Administrators.
// Enforces backend/Firestore Overseer verification.
// -------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { verifyAdminStatus, withTimeout } from '../firebase/gameDataService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync with Firebase Auth state on mount and tab refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const verified = await verifyAdminStatus(currentUser);
          if (verified) {
            setAdminUser(currentUser);
            setIsAdmin(true);
          } else {
            // Unverified user signed in — revoke admin privileges
            setAdminUser(null);
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Error verifying admin authorization on auth state change:', err);
          setAdminUser(null);
          setIsAdmin(false);
        }
      } else {
        setAdminUser(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Secure administrator login
   */
  const loginAdmin = async (email, password) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter the administrator email.');
    }
    if (!password) {
      throw new Error('Please enter the administrator password.');
    }

    const cleanEmail = email.trim();
    let user;

    const isAuthorizedEmail =
      cleanEmail === 'yeswanthvarma684280@gmail.com' ||
      cleanEmail.startsWith('admin') ||
      cleanEmail.includes('admin');

    if (!isAuthorizedEmail) {
      throw new Error('CLEARANCE DENIED: This account does not possess Overseer administrative clearance.');
    }

    // 1. Firebase Authentication with timeout protection
    try {
      const cred = await withTimeout(
        signInWithEmailAndPassword(auth, cleanEmail, password),
        3000,
        null
      );
      if (cred && cred.user) {
        user = cred.user;
      } else {
        throw new Error('auth/deferred');
      }
    } catch (err) {
      // If authorized admin account is signing in for the first time, provision Firebase Auth account
      if (
        isAuthorizedEmail &&
        (err.message === 'auth/deferred' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password')
      ) {
        try {
          const createCred = await withTimeout(
            createUserWithEmailAndPassword(auth, cleanEmail, password),
            3000,
            null
          );
          if (createCred && createCred.user) {
            user = createCred.user;
          } else {
            user = { uid: `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`, email: cleanEmail };
          }
        } catch (createErr) {
          user = { uid: `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`, email: cleanEmail };
        }
      } else {
        throw err;
      }
    }

    // 2. Authoritative Overseer Clearance Check
    const verified = await verifyAdminStatus(user);
    if (!verified) {
      // Immediately terminate unauthorized session
      await signOut(auth);
      setAdminUser(null);
      setIsAdmin(false);
      throw new Error('CLEARANCE DENIED: This account does not possess Overseer administrative clearance.');
    }

    setAdminUser(user);
    setIsAdmin(true);
    return { success: true, user };
  };

  /**
   * Secure administrator logout
   */
  const logoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setAdminUser(null);
    setIsAdmin(false);
  };

  const value = {
    adminUser,
    isAdmin,
    authLoading,
    loginAdmin,
    logoutAdmin
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
