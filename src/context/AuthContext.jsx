// -------------------------------------------------------------
// SHADOW ASCENSION - PRODUCTION AUTHENTICATION CONTEXT
// Centralized Authentication Provider backed authoritative by
// Firebase Authentication and Firestore users/{uid} profiles.
// -------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { auth, db } from '../firebase/firebaseConfig';
import { createInitialUserDoc, getUserProfile } from '../firebase/userService';

export const AuthContext = createContext(null);

const MASTER_ADMIN_EMAILS = [
  'shadow.admin@shadowascension.com',
  'pothuri2455@gmail.com'
];

function isMasterAdminEmail(email) {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

async function safeSetDoc(docRef, data, options = { merge: true }) {
  try {
    await Promise.race([
      setDoc(docRef, data, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore sync deferred')), 1200))
    ]);
  } catch (err) {
    console.warn('Firestore notice:', err?.message || err);
  }
}

/**
 * Maps raw Firebase Auth errors to clear, user-friendly messages.
 * Prevents raw stack traces from reaching the UI.
 */
export function formatAuthError(err) {
  if (!err) return 'An unexpected authentication error occurred.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'Your account is currently inactive. Contact an administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access temporarily restricted. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connectivity.';
    default:
      if (err.message && (
        err.message.includes('INVALID_LOGIN_CREDENTIALS') ||
        err.message.includes('EMAIL_NOT_FOUND') ||
        err.message.includes('INVALID_PASSWORD') ||
        err.message.toLowerCase().includes('password')
      )) {
        return 'Invalid email or password.';
      }
      return err.message || 'Authentication failed. Please verify your credentials.';
  }
}

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

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegisteringRef = React.useRef(false);

  /**
   * Refreshes the current user's profile and custom claims from Firestore & Firebase Auth
   */
  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      setFirebaseUser(null);
      setProfile(null);
      return null;
    }

    try {
      const fbUser = auth.currentUser;
      const tokenResult = await fbUser.getIdTokenResult(true);
      const hasAdminClaim = Boolean(tokenResult.claims.admin);
      const isMasterAdmin = isMasterAdminEmail(fbUser.email);

      let userProfile = await getUserProfile(fbUser.uid);

      if (!userProfile && isMasterAdmin) {
        const adminDoc = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: 'Shadow Ascension Admin',
          role: 'admin',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        try {
          await safeSetDoc(doc(db, 'users', fbUser.uid), adminDoc, { merge: true });
          userProfile = adminDoc;
        } catch (e) {
          console.warn('Could not auto-create admin doc:', e);
        }
      }

      let role = 'user';
      if (hasAdminClaim || userProfile?.role === 'admin' || isMasterAdmin) {
        role = 'admin';
      }

      const status = userProfile?.status || 'active';
      if (status !== 'active') {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        setProfile(null);
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_user_cache');
        throw new Error('Your account is currently inactive. Contact an administrator.');
      }

      const combinedUser = {
        uid: fbUser.uid,
        id: fbUser.uid,
        email: fbUser.email,
        displayName: userProfile?.displayName || fbUser.displayName || (role === 'admin' ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
        role,
        status,
        admin: role === 'admin',
        ...userProfile
      };

      setFirebaseUser(fbUser);
      setProfile(userProfile);
      setUser(combinedUser);

      const idToken = await fbUser.getIdToken();
      localStorage.setItem('sa_token', idToken);
      localStorage.setItem('sa_user_cache', JSON.stringify(combinedUser));

      return combinedUser;
    } catch (err) {
      console.warn('Error refreshing profile:', err);
      throw err;
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(safetyTimer);
      if (!mounted) return;
      if (isRegisteringRef.current) {
        return;
      }
      if (fbUser) {
        try {
          const tokenResult = await fbUser.getIdTokenResult();
          const hasAdminClaim = Boolean(tokenResult.claims.admin);
          const isMasterAdmin = isMasterAdminEmail(fbUser.email);

          let userProfile = null;
          try {
            userProfile = await getUserProfile(fbUser.uid);
          } catch (e) {
            console.warn('Firestore profile lookup error:', e);
          }

          if (!userProfile && isMasterAdmin) {
            const adminDoc = {
              uid: fbUser.uid,
              displayName: 'Shadow Ascension Admin',
              email: fbUser.email,
              role: 'admin',
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            try {
              await safeSetDoc(doc(db, 'users', fbUser.uid), adminDoc, { merge: true });
              userProfile = adminDoc;
            } catch (e) {}
          }

          let role = 'user';
          if (hasAdminClaim || userProfile?.role === 'admin' || isMasterAdmin) {
            role = 'admin';
          }

          const status = userProfile?.status || 'active';
          if (status !== 'active') {
            await signOut(auth);
            if (mounted) {
              setUser(null);
              setFirebaseUser(null);
              setProfile(null);
              localStorage.removeItem('sa_token');
              localStorage.removeItem('sa_user_cache');
              setLoading(false);
            }
            return;
          }

          const combinedUser = {
            uid: fbUser.uid,
            id: fbUser.uid,
            email: fbUser.email,
            displayName: userProfile?.displayName || fbUser.displayName || (role === 'admin' ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
            role,
            status,
            admin: role === 'admin',
            ...userProfile
          };

          const idToken = await fbUser.getIdToken();
          localStorage.setItem('sa_token', idToken);
          localStorage.setItem('sa_user_cache', JSON.stringify(combinedUser));

          if (mounted) {
            setFirebaseUser(fbUser);
            setProfile(userProfile);
            setUser(combinedUser);
          }
        } catch (err) {
          console.warn('Session synchronization warning:', err);
          if (mounted) {
            setUser(null);
            setFirebaseUser(null);
            setProfile(null);
          }
        }
      } else {
        if (mounted) {
          setFirebaseUser(null);
          setProfile(null);
          setUser(null);
          localStorage.removeItem('sa_token');
          localStorage.removeItem('sa_user_cache');
        }
      }
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  /**
   * Universal Login: Authenticates through Firebase Auth, retrieves UID, reads users/{uid},
   * checks role & status, and returns the resolved user object.
   */
  const login = async (email, password) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const cleanEmail = email.trim();
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }

    const firebaseUser = credential.user;
    const uid = firebaseUser.uid;

    // Force-fetch updated ID token to retrieve authoritative custom claims
    let hasAdminClaim = false;
    try {
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      hasAdminClaim = Boolean(tokenResult.claims?.admin);
    } catch (e) {}

    // Read Firestore profile: users/{uid}
    let userProfile = null;
    try {
      userProfile = await getUserProfile(uid);
    } catch (err) {
      console.warn('Error reading profile during login:', err);
    }

    const isMasterAdmin = isMasterAdminEmail(cleanEmail);

    // Auto-create initial admin document if master email signs in without profile
    if (isMasterAdmin && (!userProfile || userProfile.role !== 'admin')) {
      const adminDoc = {
        uid,
        email: cleanEmail,
        displayName: userProfile?.displayName || 'Shadow Ascension Admin',
        role: 'admin',
        status: 'active',
        createdAt: userProfile?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      try {
        await safeSetDoc(doc(db, 'users', uid), adminDoc, { merge: true });
        userProfile = { ...(userProfile || {}), ...adminDoc };
      } catch (e) {
        console.warn('Could not auto-create admin doc in Firestore:', e);
        userProfile = { ...(userProfile || {}), ...adminDoc };
      }
    } else if (!userProfile) {
      const defaultDoc = {
        uid,
        email: cleanEmail,
        displayName: firebaseUser.displayName || 'AWAKENED HUNTER',
        role: 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      try {
        await safeSetDoc(doc(db, 'users', uid), defaultDoc, { merge: true });
        userProfile = defaultDoc;
      } catch (e) {
        userProfile = defaultDoc;
      }
    }

    // Determine role
    let role = 'user';
    if (hasAdminClaim || userProfile?.role === 'admin' || isMasterAdmin) {
      role = 'admin';
    }

    // Check account status
    const status = userProfile?.status || 'active';
    if (status !== 'active') {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setProfile(null);
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user_cache');
      throw new Error('Your account is currently inactive. Contact an administrator.');
    }

    const combinedUser = {
      uid,
      id: uid,
      email: firebaseUser.email,
      displayName: userProfile?.displayName || firebaseUser.displayName || (role === 'admin' ? 'Shadow Ascension Admin' : 'AWAKENED HUNTER'),
      role,
      status,
      admin: role === 'admin',
      ...userProfile
    };

    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('sa_token', idToken);
    localStorage.setItem('sa_user_cache', JSON.stringify(combinedUser));

    setFirebaseUser(firebaseUser);
    setProfile(userProfile);
    setUser(combinedUser);

    return { user: combinedUser, role, profile: userProfile };
  };

  /**
   * Public Player Registration:
   * 1. Creates Firebase Authentication user account
   * 2. Creates Firestore users/{uid} document with role: "user" and status: "active"
   * 3. Signs out to require login through the unified /login page
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
      isRegisteringRef.current = true;
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      fbUser = userCredential.user;

      try {
        await updateProfile(fbUser, { displayName: cleanName });
      } catch (e) {}

      // Create Firestore document with role: "user" and status: "active"
      try {
        await createInitialUserDoc(fbUser.uid, {
          displayName: cleanName,
          email: cleanEmail,
          role: 'user' // STRICTLY role="user" for public registration
        });
      } catch (err) {
        console.warn('Initial user profile sync notice:', err);
      }

      // Authoritatively sign out to fulfill the exact user flow: /register -> redirect -> /login
      try {
        await signOut(auth);
      } catch (e) {}

      setUser(null);
      setFirebaseUser(null);
      setProfile(null);
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user_cache');

      return { success: true, uid: fbUser.uid };
    } catch (err) {
      throw new Error(formatAuthError(err));
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setProfile(null);
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user_cache');
      isRegisteringRef.current = false;
    }
  };

  /**
   * Universal Logout: signs out from Firebase Auth, clears local tokens, redirects to /login
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Logout notice:', err);
    }
    setFirebaseUser(null);
    setProfile(null);
    setUser(null);
    localStorage.removeItem('sa_user_cache');
    localStorage.removeItem('sa_token');
  };

  /**
   * Authenticated password change
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Authentication required.');
    }
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      return { success: true, message: 'Password updated successfully.' };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  const isAuthenticated = Boolean(user && firebaseUser);

  const value = {
    user,
    firebaseUser,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isUser,
    login,
    register,
    logout,
    refreshProfile,
    changePassword,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Backwards-compatible aliases
export const useCustomAuth = useAuth;
export const CustomAuthProvider = AuthProvider;
export const CustomAuthContext = AuthContext;

export default AuthContext;
