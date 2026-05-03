import { useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// ── Main auth hook ────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ── Current user hook ────────────────────────────────────────────────────

export const useCurrentUser = () => {
  const { user, loading, initializing } = useAuth();
  return useMemo(() => ({
    user,
    isLoading: loading || initializing,
    isAuthenticated: !!user,
  }), [user, loading, initializing]);
};

// ── Protected route hook ─────────────────────────────────────────────────

export const useRequireAuth = (options = {}) => {
  const { user, loading, initializing, isEmailVerified, hasRole, isPremium, sendVerificationEmail } = useAuth();
  
  const { requireEmailVerified = false, requiredRole = null, requirePremium = false, redirectTo = '/login' } = options;
  
  const isLoading = loading || initializing;
  
  const canAccess = useMemo(() => {
    if (!user) return false;
    if (requireEmailVerified && !isEmailVerified) return false;
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (requirePremium && !isPremium) return false;
    return true;
  }, [user, requireEmailVerified, isEmailVerified, requiredRole, hasRole, requirePremium, isPremium]);
  
  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    isEmailVerified,
    isPremium,
    canAccess,
    hasRole,
    sendVerificationEmail,
    redirectTo: canAccess ? null : redirectTo,
  }), [user, isLoading, isEmailVerified, isPremium, canAccess, hasRole, sendVerificationEmail, redirectTo]);
};

// ── Role hook ────────────────────────────────────────────────────────────

export const useRole = () => {
  const { userRole, hasRole, isPremium } = useAuth();
  
  return useMemo(() => ({
    role: userRole,
    isAdmin: userRole === 'admin',
    isPremium,
    isUser: userRole === 'user',
    hasRole,
    canAccessAdmin: userRole === 'admin',
    canAccessPremium: isPremium || userRole === 'admin',
  }), [userRole, hasRole, isPremium]);
};

// ── Profile management hook ──────────────────────────────────────────────

export const useProfile = () => {
  const { user, userData, updateUserProfile, updateUserEmail, updateUserPassword, sendVerificationEmail, isEmailVerified } = useAuth();
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const withLoading = useCallback(async (asyncFn) => {
    setUpdating(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result ?? true;
    } catch (err) {
      if (mountedRef.current) setError(err);
      return false;
    } finally {
      if (mountedRef.current) setUpdating(false);
    }
  }, []);
  
  const updateProfile = useCallback((profileData) => withLoading(() => updateUserProfile(profileData)), [withLoading, updateUserProfile]);
  const updateEmail = useCallback((newEmail, password) => withLoading(() => updateUserEmail(newEmail, password)), [withLoading, updateUserEmail]);
  const updatePassword = useCallback((currentPassword, newPassword) => withLoading(() => updateUserPassword(currentPassword, newPassword)), [withLoading, updateUserPassword]);
  const resendVerification = useCallback(() => withLoading(() => sendVerificationEmail()), [withLoading, sendVerificationEmail]);
  
  return useMemo(() => ({
    user, profile: userData, isEmailVerified, updating, error,
    updateProfile, updateEmail, updatePassword, resendVerification,
  }), [user, userData, isEmailVerified, updating, error, updateProfile, updateEmail, updatePassword, resendVerification]);
};

// ── Auth actions hook ────────────────────────────────────────────────────

export const useAuthActions = () => {
  const { login, signup, logout, resetPassword, confirmPasswordReset, loginWithProvider, loginWithPhone, linkProvider, unlinkProvider, deleteAccount, loading } = useAuth();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const wrapAction = useCallback(async (action) => {
    setActionLoading(true);
    setError(null);
    try {
      const result = await action();
      return { success: true, ...(result && typeof result === 'object' ? result : { data: result }) };
    } catch (err) {
      if (mountedRef.current) setError(err);
      return { success: false, error: err };
    } finally {
      if (mountedRef.current) setActionLoading(false);
    }
  }, []);
  
  const handleLogin = useCallback((email, password, rememberMe) => wrapAction(() => login(email, password, rememberMe)), [wrapAction, login]);
  const handleSignup = useCallback((email, password, displayName) => wrapAction(() => signup(email, password, displayName)), [wrapAction, signup]);
  const handleLogout = useCallback(() => wrapAction(() => logout()), [wrapAction, logout]);
  const handleSocialLogin = useCallback((provider) => wrapAction(() => loginWithProvider(provider)), [wrapAction, loginWithProvider]);
  const handlePhoneLogin = useCallback((phoneNumber, recaptcha) => wrapAction(() => loginWithPhone(phoneNumber, recaptcha)), [wrapAction, loginWithPhone]);
  const handleResetPassword = useCallback((email) => wrapAction(() => resetPassword(email)), [wrapAction, resetPassword]);
  const handleConfirmPasswordReset = useCallback((oobCode, newPassword) => wrapAction(() => confirmPasswordReset(oobCode, newPassword)), [wrapAction, confirmPasswordReset]);
  const handleLinkProvider = useCallback((provider) => wrapAction(() => linkProvider(provider)), [wrapAction, linkProvider]);
  const handleUnlinkProvider = useCallback((providerId) => wrapAction(() => unlinkProvider(providerId)), [wrapAction, unlinkProvider]);
  const handleDeleteAccount = useCallback((password) => wrapAction(() => deleteAccount(password)), [wrapAction, deleteAccount]);
  
  return useMemo(() => ({
    isLoading: actionLoading || loading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    socialLogin: handleSocialLogin,
    phoneLogin: handlePhoneLogin,
    resetPassword: handleResetPassword,
    confirmPasswordReset: handleConfirmPasswordReset,
    linkProvider: handleLinkProvider,
    unlinkProvider: handleUnlinkProvider,
    deleteAccount: handleDeleteAccount,
  }), [actionLoading, loading, error, handleLogin, handleSignup, handleLogout, handleSocialLogin, handlePhoneLogin, handleResetPassword, handleConfirmPasswordReset, handleLinkProvider, handleUnlinkProvider, handleDeleteAccount]);
};

// ── Subscription hook ────────────────────────────────────────────────────

export const useSubscription = () => {
  const { subscription, isPremium, user } = useAuth();
  
  const isTrialing = useMemo(() => subscription?.status === 'trialing', [subscription?.status]);
  const isActive = useMemo(() => subscription?.status === 'active' || subscription?.status === 'trialing', [subscription?.status]);
  const isCanceled = useMemo(() => subscription?.cancelAtPeriodEnd === true, [subscription?.cancelAtPeriodEnd]);
  
  const daysRemaining = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return 0;
    const end = new Date(subscription.currentPeriodEnd).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [subscription?.currentPeriodEnd]);
  
  return useMemo(() => ({
    subscription, isPremium, isTrialing, isActive, isCanceled, daysRemaining,
    plan: subscription?.plan || 'free',
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
  }), [subscription, isPremium, isTrialing, isActive, isCanceled, daysRemaining]);
};

// ── Session hook ─────────────────────────────────────────────────────────

export const useSession = () => {
  const { user, getToken, getTokenResult, loading } = useAuth();
  const [token, setToken] = useState(null);
  const [claims, setClaims] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setToken(null);
      setClaims(null);
      return;
    }
    
    let isActive = true;

    const refreshToken = async () => {
      try {
        // FIXED: getTokenResult includes the token, no need for separate getToken call
        const result = await getTokenResult(true);
        if (isActive && mountedRef.current) {
          setToken(result?.token || null);
          setClaims(result?.claims || null);
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    };
    
    refreshToken();
    
    // Refresh every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [user, getTokenResult]);
  
  return useMemo(() => ({
    user, token, claims,
    isLoading: loading,
    isAuthenticated: !!user,
    sessionExpiry: claims?.exp ? new Date(claims.exp * 1000) : null,
  }), [user, token, claims, loading]);
};

// ── Auth state with redirect hook ────────────────────────────────────────

export const useAuthState = (options = {}) => {
  const { user, loading, initializing } = useAuth();
  const { redirectTo = '/login', redirectIfAuth = '/dashboard' } = options;
  
  return useMemo(() => ({
    user,
    isLoading: loading || initializing,
    isAuthenticated: !!user,
    redirectTo: user ? redirectIfAuth : redirectTo,
  }), [user, loading, initializing, redirectIfAuth, redirectTo]);
};

// ── Auth error watcher hook ──────────────────────────────────────────────

export const useAuthError = () => {
  const { authError } = useAuth();
  const [error, setError] = useState(null);
  const errorIdRef = useRef(0);

  // FIXED: Track error by ID so same error occurring again will show
  useEffect(() => {
    if (authError) {
      const id = ++errorIdRef.current;
      setError(authError);
      
      const timer = setTimeout(() => {
        // Only clear if this is still the current error
        if (id === errorIdRef.current) {
          setError(null);
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [authError]);
  
  return useMemo(() => ({
    error,
    clearError: () => {
      setError(null);
      errorIdRef.current++;
    },
  }), [error]);
};

// ── Combined full auth hook ──────────────────────────────────────────────

export const useAuthFull = () => {
  const auth = useAuth();
  const currentUser = useCurrentUser();
  const role = useRole();
  const profile = useProfile();
  const actions = useAuthActions();
  const subscription = useSubscription();
  const session = useSession();
  const authError = useAuthError();
  
  // FIXED: Use explicit naming to avoid conflicts
  return useMemo(() => ({
    // Basic auth state
    user: auth.user,
    userData: auth.userData,
    userRole: auth.userRole,
    loading: auth.loading,
    initializing: auth.initializing,
    isEmailVerified: auth.isEmailVerified,
    isPremium: auth.isPremium,
    linkedProviders: auth.linkedProviders,
    mfaEnabled: auth.mfaEnabled,
    refreshUserData: auth.refreshUserData,
    
    // Current user
    isAuthenticated: currentUser.isAuthenticated,
    
    // Role & permissions
    role: role.role,
    isAdmin: role.isAdmin,
    canAccessAdmin: role.canAccessAdmin,
    canAccessPremium: role.canAccessPremium,
    hasRole: role.hasRole,
    
    // Profile management
    profile: profile.profile,
    profileUpdating: profile.updating,
    profileError: profile.error,
    updateProfile: profile.updateProfile,
    updateEmail: profile.updateEmail,
    updatePassword: profile.updatePassword,
    resendVerification: profile.resendVerification,
    
    // Auth actions
    actionLoading: actions.isLoading,
    actionError: actions.error,
    login: actions.login,
    signup: actions.signup,
    logout: actions.logout,
    socialLogin: actions.socialLogin,
    phoneLogin: actions.phoneLogin,
    resetPassword: actions.resetPassword,
    confirmPasswordReset: actions.confirmPasswordReset,
    linkProvider: actions.linkProvider,
    unlinkProvider: actions.unlinkProvider,
    deleteAccount: actions.deleteAccount,
    
    // Subscription
    subscription: subscription.subscription,
    isTrialing: subscription.isTrialing,
    isSubscriptionActive: subscription.isActive,
    isCanceled: subscription.isCanceled,
    daysRemaining: subscription.daysRemaining,
    plan: subscription.plan,
    
    // Session
    token: session.token,
    claims: session.claims,
    sessionExpiry: session.sessionExpiry,
    
    // Error
    authError: authError.error,
    clearAuthError: authError.clearError,
    
    // Combined
    isLoading: auth.loading || auth.initializing || actions.isLoading || profile.updating,
  }), [auth, currentUser, role, profile, actions, subscription, session, authError]);
};

export default useAuth;