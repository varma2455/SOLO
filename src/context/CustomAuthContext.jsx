// -------------------------------------------------------------
// SHADOW ASCENSION - FIREBASE AUTHENTICATION & FIRESTORE CONTEXT
// Universal single login provider for both Admin and User roles.
// Uses Firebase Auth for credentials and Firestore for profile & roles.
// -------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { createInitialUserDoc, getUserProfile } from '../firebase/userService';

const CustomAuthContext = createContext(null);

const MASTER_ADMIN_EMAIL = 'pothuri2455@gmail.com';

/**
 * Authoritative API fetcher with automatic Firebase ID Token attachment
 */
export const authFetch = async (url, options = {}) => {
  let token = localStorage.getItem('sa_token');
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
      localStorage.setItem('sa_token', token);
    } catch (e) {
      // Fall back to stored token
    }
  }

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

export const CustomAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync state with Firebase Authentication & Firestore profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // 1. Get token result for custom claims
          const tokenResult = await fbUser.getIdTokenResult();
          const hasAdminClaim = Boolean(tokenResult.claims.admin);
          const isMasterAdmin = fbUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

          // 2. Read Firestore profile
          let profile = null;
          try {
            profile = await getUserProfile(fbUser.uid);
          } catch (err) {
            console.warn('Firestore profile lookup error:', err);
          }

          // If no profile exists for master admin, auto-create it
          if (!profile && isMasterAdmin) {
            const adminProf = {
              uid: fbUser.uid,
              displayName: 'Game Administrator',
              email: fbUser.email,
              role: 'admin',
              status: 'active',
              createdAt: serverTimestamp()
            };
            try {
              await setDoc(doc(db, 'users', fbUser.uid), adminProf, { merge: true });
              profile = adminProf;
            } catch (e) {}
          }

          // Determine role
          let role = 'user';
          if (hasAdminClaim || profile?.role === 'admin' || isMasterAdmin) {
            role = 'admin';
          }

          // Check if disabled
          if (profile?.status === 'disabled') {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('sa_token');
            localStorage.removeItem('sa_user_cache');
            setLoading(false);
            return;
          }

          const safeUser = {
            uid: fbUser.uid,
            id: fbUser.uid,
            email: fbUser.email,
            displayName: profile?.displayName || fbUser.displayName || (role === 'admin' ? 'Game Administrator' : 'AWAKENED HUNTER'),
            role,
            status: profile?.status || 'active',
            admin: role === 'admin',
            ...profile
          };

          const idToken = await fbUser.getIdToken();
          localStorage.setItem('sa_token', idToken);
          localStorage.setItem('sa_user_cache', JSON.stringify(safeUser));

          setUser(safeUser);
        } catch (err) {
          console.warn('Session synchronization warning:', err);
          // Restore from cache if available
          try {
            const cached = localStorage.getItem('sa_user_cache');
            if (cached) setUser(JSON.parse(cached));
          } catch (e) {}
        }
      } else {
        setUser(null);
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_user_cache');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Universal Login for both Admin and User:
   * 1. Calls signInWithEmailAndPassword(auth, email, password)
   * 2. Reads Firestore users/{uid}
   * 3. Checks role (and admin claims / master email)
   * 4. Returns { user, role }
   */
  const login = async (email, password) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const cleanEmail = email.trim();
    let fbUser;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      fbUser = userCredential.user;
    } catch (err) {
      // Map Firebase Auth error codes to user-friendly messages
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        throw new Error('Invalid email or password.');
      } else if (err.code === 'auth/user-disabled') {
        throw new Error('Your account has been disabled. Please contact the administrator.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
      }
    }

    // Read custom claims
    let hasAdminClaim = false;
    try {
      const tokenResult = await fbUser.getIdTokenResult(true);
      hasAdminClaim = Boolean(tokenResult.claims.admin);
    } catch (e) {}

    // Read Firestore user profile
    let profile = null;
    try {
      profile = await getUserProfile(fbUser.uid);
    } catch (err) {
      console.warn('Error reading profile during login:', err);
    }

    const isMasterAdmin = cleanEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

    // Auto-create initial admin document if master email signs in
    if (!profile && isMasterAdmin) {
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        const adminDoc = {
          uid: fbUser.uid,
          displayName: 'Game Administrator',
          email: cleanEmail,
          role: 'admin',
          status: 'active',
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, adminDoc, { merge: true });
        profile = adminDoc;
      } catch (e) {}
    }

    // Role determination
    let role = 'user';
    if (hasAdminClaim || profile?.role === 'admin' || isMasterAdmin) {
      role = 'admin';
    }

    // Check account status
    if (profile?.status === 'disabled') {
      await signOut(auth);
      throw new Error('Your account has been disabled. Please contact the administrator.');
    }

    const safeUser = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      displayName: profile?.displayName || fbUser.displayName || (role === 'admin' ? 'Game Administrator' : 'AWAKENED HUNTER'),
      role,
      status: profile?.status || 'active',
      admin: role === 'admin',
      ...profile
    };

    const idToken = await fbUser.getIdToken();
    localStorage.setItem('sa_token', idToken);
    localStorage.setItem('sa_user_cache', JSON.stringify(safeUser));

    setUser(safeUser);

    return { user: safeUser, role };
  };

  /**
   * New Player Registration:
   * 1. Calls createUserWithEmailAndPassword()
   * 2. Creates users/{uid} in Firestore with role: "user"
   * 3. Initializes isolated player progress
   * 4. Signs out so player can log in through the unified flow
   */
  const register = async (displayName, email, password) => {
    if (!displayName || !displayName.trim()) {
      throw new Error('Please provide player name.');
    }
    if (!email || !email.trim()) {
      throw new Error('Please provide an email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim();
    const cleanName = displayName.trim();
    let fbUser;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      fbUser = userCredential.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Please provide a valid email address.');
      } else {
        throw new Error(err.message || 'Registration failed.');
      }
    }

    // Update display name
    try {
      await updateProfile(fbUser, { displayName: cleanName });
    } catch (e) {}

    // Create Firestore profile (STRICTLY ROLE: "user")
    try {
      await createInitialUserDoc(fbUser.uid, {
        displayName: cleanName,
        email: cleanEmail,
        role: 'user' // STRICTLY USER FOR PUBLIC REGISTRATION
      });
    } catch (err) {
      console.warn('Initial user profile sync warning:', err);
    }

    // Sign out to fulfill the exact user flow: /register -> CREATE ACCOUNT -> /login
    try {
      await signOut(auth);
    } catch (e) {}

    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user_cache');

    return { success: true, uid: fbUser.uid };
  };

  /**
   * Universal Logout
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Logout notice:', err);
    }
    setUser(null);
    localStorage.removeItem('sa_user_cache');
    localStorage.removeItem('sa_token');
  };

  /**
   * User Password Change
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Authentication required.');
    }
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await updatePassword(auth.currentUser, newPassword);
    return { success: true, message: 'Password updated successfully.' };
  };

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  const value = {
    user,
    isAdmin,
    isUser,
    loading,
    login,
    register,
    logout,
    changePassword,
    authFetch
  };

  return <CustomAuthContext.Provider value={value}>{children}</CustomAuthContext.Provider>;
};

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (!context) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};

export default CustomAuthProvider;
