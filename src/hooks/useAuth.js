import { useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Main auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to get current user with loading state
export const useCurrentUser = () => {
  const { user, loading, initializing } = useAuth();
  return { user, isLoading: loading || initializing, isAuthenticated: !!user };
};

// Hook for protected actions (requires authentication)
export const useRequireAuth = (options = {}) => {
  const { 
    user, 
    loading, 
    initializing,
    isEmailVerified, 
    hasRole, 
    isPremium,
    sendVerificationEmail 
  } = useAuth();
  
  const { 
    requireEmailVerified = false, 
    requiredRole = null, 
    requirePremium = false,
    redirectTo = '/login'
  } = options;
  
  const isLoading = loading || initializing;
  
  const canAccess = useMemo(() => {
    if (!user) return false;
    if (requireEmailVerified && !isEmailVerified) return false;
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (requirePremium && !isPremium) return false;
    return true;
  }, [user, requireEmailVerified, isEmailVerified, requiredRole, hasRole, requirePremium, isPremium]);
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isEmailVerified,
    isPremium,
    canAccess,
    hasRole,
    sendVerificationEmail,
    redirectTo: canAccess ? null : redirectTo
  };
};

// Hook for role-based access control
export const useRole = () => {
  const { userRole, hasRole, isPremium } = useAuth();
  
  return {
    role: userRole,
    isAdmin: userRole === 'admin',
    isPremium: isPremium,
    isUser: userRole === 'user',
    hasRole,
    canAccessAdmin: userRole === 'admin',
    canAccessPremium: isPremium || userRole === 'admin'
  };
};

// Hook for profile management
export const useProfile = () => {
  const { 
    user, 
    userData, 
    updateUserProfile, 
    updateUserEmail, 
    updateUserPassword,
    sendVerificationEmail,
    isEmailVerified
  } = useAuth();
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const updateProfile = useCallback(async (profileData) => {
    setUpdating(true);
    setError(null);
    try {
      await updateUserProfile(profileData);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [updateUserProfile]);
  
  const updateEmail = useCallback(async (newEmail, password) => {
    setUpdating(true);
    setError(null);
    try {
      await updateUserEmail(newEmail, password);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [updateUserEmail]);
  
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    setUpdating(true);
    setError(null);
    try {
      await updateUserPassword(currentPassword, newPassword);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [updateUserPassword]);
  
  const resendVerification = useCallback(async () => {
    setUpdating(true);
    setError(null);
    try {
      await sendVerificationEmail();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [sendVerificationEmail]);
  
  return {
    user,
    profile: userData,
    isEmailVerified,
    updating,
    error,
    updateProfile,
    updateEmail,
    updatePassword,
    resendVerification
  };
};

// Hook for authentication actions (login, signup, logout)
export const useAuthActions = () => {
  const { 
    login, 
    signup, 
    logout, 
    resetPassword,
    confirmPasswordReset,
    loginWithProvider,
    loginWithPhone,
    linkProvider,
    unlinkProvider,
    deleteAccount,
    loading 
  } = useAuth();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleLogin = useCallback(async (email, password, rememberMe = true) => {
    setActionLoading(true);
    setError(null);
    try {
      const user = await login(email, password, rememberMe);
      return { success: true, user };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [login]);
  
  const handleSignup = useCallback(async (email, password, displayName) => {
    setActionLoading(true);
    setError(null);
    try {
      const user = await signup(email, password, displayName);
      return { success: true, user };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [signup]);
  
  const handleLogout = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      await logout();
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [logout]);
  
  const handleSocialLogin = useCallback(async (provider) => {
    setActionLoading(true);
    setError(null);
    try {
      const user = await loginWithProvider(provider);
      return { success: true, user };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [loginWithProvider]);
  
  const handlePhoneLogin = useCallback(async (phoneNumber, recaptchaVerifier) => {
    setActionLoading(true);
    setError(null);
    try {
      const confirmation = await loginWithPhone(phoneNumber, recaptchaVerifier);
      return { success: true, confirmation };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [loginWithPhone]);
  
  const handleResetPassword = useCallback(async (email) => {
    setActionLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [resetPassword]);
  
  const handleConfirmPasswordReset = useCallback(async (oobCode, newPassword) => {
    setActionLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(oobCode, newPassword);
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [confirmPasswordReset]);
  
  const handleLinkProvider = useCallback(async (provider) => {
    setActionLoading(true);
    setError(null);
    try {
      const user = await linkProvider(provider);
      return { success: true, user };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [linkProvider]);
  
  const handleUnlinkProvider = useCallback(async (providerId) => {
    setActionLoading(true);
    setError(null);
    try {
      await unlinkProvider(providerId);
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [unlinkProvider]);
  
  const handleDeleteAccount = useCallback(async (password) => {
    setActionLoading(true);
    setError(null);
    try {
      await deleteAccount(password);
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, [deleteAccount]);
  
  return {
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
    deleteAccount: handleDeleteAccount
  };
};

// Hook for subscription and billing
export const useSubscription = () => {
  const { subscription, isPremium, user } = useAuth();
  
  const isTrialing = useMemo(() => {
    return subscription?.status === 'trialing';
  }, [subscription]);
  
  const isActive = useMemo(() => {
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  }, [subscription]);
  
  const isCanceled = useMemo(() => {
    return subscription?.cancelAtPeriodEnd === true;
  }, [subscription]);
  
  const daysRemaining = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return 0;
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }, [subscription]);
  
  return {
    subscription,
    isPremium,
    isTrialing,
    isActive,
    isCanceled,
    daysRemaining,
    plan: subscription?.plan || 'free',
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd
  };
};

// Hook for session management
export const useSession = () => {
  const { user, getToken, getTokenResult, loading } = useAuth();
  const [token, setToken] = useState(null);
  const [claims, setClaims] = useState(null);
  
  useEffect(() => {
    if (!user) {
      setToken(null);
      setClaims(null);
      return;
    }
    
    const refreshToken = async () => {
      const newToken = await getToken(true);
      const result = await getTokenResult(true);
      setToken(newToken);
      setClaims(result?.claims || null);
    };
    
    refreshToken();
    
    // Refresh token every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, getToken, getTokenResult]);
  
  return {
    user,
    token,
    claims,
    isLoading: loading,
    isAuthenticated: !!user,
    sessionExpiry: claims?.exp ? new Date(claims.exp * 1000) : null
  };
};

// Hook for auth state with redirect
export const useAuthState = (options = {}) => {
  const { user, loading, initializing } = useAuth();
  const { redirectTo = '/login', redirectIfAuth = '/dashboard' } = options;
  
  const isLoading = loading || initializing;
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    redirectTo: user ? redirectIfAuth : redirectTo
  };
};

// Hook for watching auth errors
export const useAuthError = () => {
  const { authError } = useAuth();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (authError) {
      setError(authError);
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);
  
  return {
    error,
    clearError: () => setError(null)
  };
};

// Combined hook for all auth functionality
export const useAuthFull = () => {
  const auth = useAuth();
  const currentUser = useCurrentUser();
  const role = useRole();
  const profile = useProfile();
  const actions = useAuthActions();
  const subscription = useSubscription();
  const session = useSession();
  const authError = useAuthError();
  
  return {
    // Basic auth state
    ...auth,
    ...currentUser,
    
    // Role and permissions
    ...role,
    
    // Profile management
    ...profile,
    
    // Auth actions
    ...actions,
    
    // Subscription
    ...subscription,
    
    // Session
    ...session,
    
    // Error handling
    ...authError,
    
    // Combined loading state
    isLoading: currentUser.isLoading || actions.isLoading || profile.updating,
    
    // Quick checks
    can: {
      accessAdmin: role.isAdmin,
      accessPremium: role.canAccessPremium,
      editProfile: currentUser.isAuthenticated,
      manageSubscription: currentUser.isAuthenticated
    }
  };
};

export default useAuth;