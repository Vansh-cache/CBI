import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { apiGet, apiPost, clearToken, setOnUnauthorized, setToken } from '../lib/api';
import { msalConfig, loginRequest, isMsalConfigured } from '../lib/msalConfig';

export type Role = 'admin' | 'developer' | 'viewer';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: Role;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  loginWithMicrosoft: (loginHint?: string) => Promise<User>;
  /** Email/password login; also used as alias for loginWithMicrosoft when called with 0–1 args */
  login: (emailOrHint: string, password?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isMsalConfigured: boolean;
  /** Register a callback to be called before logout (for autosave) */
  registerBeforeLogout: (callback: () => Promise<void> | void) => () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
  onUnauthorized?: () => void;
}

let msalInstance: PublicClientApplication | null = null;
let msalInitialized = false;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

// Detect iOS, Safari, mobile device, or popup/iframe context (all have popup restrictions)
function shouldUseRedirect(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // If we're in a popup or iframe, must use redirect
  const isInPopup = window.opener !== null || window.parent !== window;
  if (isInPopup) return true;

  const ua = navigator.userAgent || '';
  // iOS devices
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Safari browser (but not Chrome on iOS which contains Safari in UA)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  // Any mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isIOS || isSafari || isMobile;
}

export function AuthProvider({ children, onUnauthorized }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
    error: null,
  });

  // Store callbacks for before logout (e.g., autosave)
  const beforeLogoutCallbacks = useRef(new Set<() => Promise<void> | void>());

  const registerBeforeLogout = useCallback((callback: () => Promise<void> | void) => {
    beforeLogoutCallbacks.current.add(callback);
    // Return unregister function
    return () => {
      beforeLogoutCallbacks.current.delete(callback);
    };
  }, []);

  const logout = useCallback(async () => {
    type Fn = () => Promise<void> | void;
    const callbacks = Array.from(beforeLogoutCallbacks.current) as Fn[];
    if (callbacks.length > 0) {
      console.log('Running beforeLogout callbacks...');
      await Promise.all(callbacks.map((cb: Fn) => {
        try {
          return Promise.resolve(cb());
        } catch (e) {
          console.error('beforeLogout callback error:', e);
          return Promise.resolve();
        }
      }));
    }
    clearToken();
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const handleUnauthorized = useCallback(async () => {
    type Fn = () => Promise<void> | void;
    const callbacks = Array.from(beforeLogoutCallbacks.current) as Fn[];
    if (callbacks.length > 0) {
      console.log('Running beforeLogout callbacks (unauthorized)...');
      await Promise.all(callbacks.map((cb: Fn) => {
        try {
          return Promise.resolve(cb());
        } catch (e) {
          console.error('beforeLogout callback error:', e);
          return Promise.resolve();
        }
      }));
    }
    clearToken();
    setState((s) => ({ ...s, user: null, token: null }));
    onUnauthorized?.();
  }, [onUnauthorized]);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiGet<User>('/api/auth/me');
      if (res.success && res.data) {
        setState({ user: res.data, token: t, loading: false, error: null });
      } else {
        clearToken();
        setState({ user: null, token: null, loading: false, error: null });
      }
    } catch {
      clearToken();
      setState({ user: null, token: null, loading: false, error: null });
    }
  }, []);

  // Handle MSAL redirect response first (for iOS), then refresh user
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      // First: handle any MSAL redirect response (iOS flow)
      if (isMsalConfigured && !msalInitialized) {
        msalInitialized = true;
        try {
          const msal = getMsalInstance();
          await msal.initialize();
          const response = await msal.handleRedirectPromise();
          if (response?.idToken && !cancelled) {
            console.log('MSAL redirect response received');
            const res = await apiPost<{ user: User; token: string }>('/api/auth/login', {
              id_token: response.idToken,
            });
            if (res.success && res.data?.token && res.data?.user) {
              const { user, token } = res.data;
              setToken(token);
              setState({ user, token, loading: false, error: null });
              return; // Don't run refreshUser, we're already logged in
            }
          }
        } catch (e) {
          console.error('MSAL redirect handling error:', e);
          if (!cancelled) {
            setState((s) => ({ ...s, loading: false, error: 'Sign-in failed. Please try again.' }));
          }
        }
      }

      // Then: check if already logged in via token
      if (!cancelled) {
        await refreshUser();
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, [refreshUser]);

  const loginWithMicrosoft = useCallback(async (loginHint?: string): Promise<User> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const msal = getMsalInstance();
      await msal.initialize();
      const request = { ...loginRequest, ...(loginHint && { loginHint }) };

      // Use redirect on iOS/Safari/mobile (popups are blocked/restricted)
      if (shouldUseRedirect()) {
        try {
          await msal.loginRedirect(request);
          // This won't return - page will redirect
          return new Promise(() => { });
        } catch (redirectError) {
          console.error('Redirect login error:', redirectError);
          // If redirect also fails, show a clear error
          const msg = 'Unable to sign in. Please ensure pop-ups are allowed or try a different browser.';
          setState((s) => ({ ...s, loading: false, error: msg }));
          throw new Error(msg);
        }
      }

      try {
        const response = await msal.loginPopup(request);
        const idToken = response.idToken;
        if (!idToken) {
          throw new Error('No ID token received from Microsoft');
        }
        const res = await apiPost<{ user: User; token: string }>('/api/auth/login', {
          id_token: idToken,
        });
        if (!res.success || !res.data?.token || !res.data?.user) {
          throw new Error(res.message || 'Sign-in failed');
        }
        const { user, token } = res.data;
        setToken(token);
        setState({ user, token, loading: false, error: null });
        return user;
      } catch (popupError) {
        console.error('Popup login error:', popupError);
        try {
          await msal.loginRedirect(request);
          // This won't return - page will redirect
          return new Promise(() => { });
        } catch (redirectError) {
          console.error('Redirect login error:', redirectError);
          const msg = 'Unable to sign in. Please ensure pop-ups are allowed or try a different browser.';
          setState((s) => ({ ...s, loading: false, error: msg }));
          throw new Error(msg);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      setState((s) => ({
        ...s,
        loading: false,
        error: msg,
        user: null,
        token: null,
      }));
      throw e;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const login = useCallback(async (emailOrHint: string, password?: string): Promise<User> => {
    if (password !== undefined) {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await apiPost<{ user: User; token: string }>('/api/auth/login', { email: emailOrHint, password });
        if (!res.success || !res.data?.token || !res.data?.user) {
          throw new Error(res.message || 'Login failed');
        }
        const { user, token } = res.data;
        setToken(token);
        setState({ user, token, loading: false, error: null });
        return user;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Login failed';
        setState((s) => ({ ...s, loading: false, error: msg, user: null, token: null }));
        throw e;
      }
    }
    return loginWithMicrosoft(emailOrHint);
  }, [loginWithMicrosoft]);

  const value: AuthContextValue = {
    ...state,
    loginWithMicrosoft,
    login,
    logout,
    refreshUser,
    clearError,
    isMsalConfigured,
    registerBeforeLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
