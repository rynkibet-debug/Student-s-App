import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext(null);

const AUTH_USER_KEY = 'students-student_auth_user';
const TOKEN_KEY = 'students-student_auth_token';
const TOKEN_META_KEY = 'students-student_auth_token_meta';
const CACHE_PREFIX = 'students-app_cache_';


const CHUNK_SIZE = 1800;


const EXPIRY_SKEW_MS = 30_000;



let secureAvailable = null;

async function isSecureAvailable() {
  if (secureAvailable !== null) return secureAvailable;
  if (Platform.OS === 'web') {
    secureAvailable = false;
    return false;
  }
  try {
    secureAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureAvailable = false;
  }
  return secureAvailable;
}

function chunk(str, size) {
  const out = [];
  for (let i = 0; i < str.length; i += size) {
    out.push(str.slice(i, i + size));
  }
  return out;
}

async function writeToken(token) {
  const secure = await isSecureAvailable();

  if (!secure) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await clearSecureChunks();

  const parts = chunk(token, CHUNK_SIZE);
  await SecureStore.setItemAsync(
    TOKEN_META_KEY,
    String(parts.length)
  );

  for (let i = 0; i < parts.length; i++) {
    await SecureStore.setItemAsync(`${TOKEN_KEY}_${i}`, parts[i]);
  }
}

async function readToken() {
  const secure = await isSecureAvailable();

  if (!secure) {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  const count = Number(
    await SecureStore.getItemAsync(TOKEN_META_KEY)
  );
  if (!Number.isInteger(count) || count < 1) return null;

  const parts = [];
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${TOKEN_KEY}_${i}`);
    // A missing chunk means the value is corrupt, not partially usable.
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function clearSecureChunks() {
  const count = Number(
    await SecureStore.getItemAsync(TOKEN_META_KEY)
  );
  if (Number.isInteger(count) && count > 0) {
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${TOKEN_KEY}_${i}`);
    }
  }
  await SecureStore.deleteItemAsync(TOKEN_META_KEY);
}

async function deleteToken() {
  const secure = await isSecureAvailable();
  if (!secure) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  await clearSecureChunks();
}



function base64UrlDecode(input) {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');

  if (typeof atob === 'function') return atob(padded);
  if (typeof global !== 'undefined' && global.Buffer) {
    return global.Buffer.from(padded, 'base64').toString('binary');
  }
  throw new Error('No base64 decoder available');
}

function isTokenExpired(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return false; // Not a JWT; let the server decide.

    const { exp } = JSON.parse(base64UrlDecode(payload));
    if (typeof exp !== 'number') return false;

    return Date.now() >= exp * 1000 - EXPIRY_SKEW_MS;
  } catch {
    // Unparseable token — treat as unusable rather than trusting it.
    return true;
  }
}

/* ------------------------------------------------------------------ */

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [storageError, setStorageError] = useState(null);


  const tokenRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPersistedAuth() {
      let savedUser = null;
      let savedToken = null;
      let readFailed = false;

      try {
        savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        savedToken = await readToken();
      } catch (err) {
       
        readFailed = true;
        if (!cancelled) setStorageError(err);
      }

      if (cancelled) return;

      if (!readFailed && savedUser && savedToken) {
        if (isTokenExpired(savedToken)) {
          await clearPersisted();
        } else {
          try {
            const parsed = JSON.parse(savedUser);
            tokenRef.current = savedToken;
            setUser({ ...parsed, token: savedToken });
            setIsLoggedIn(true);
          } catch {

            await clearPersisted();
          }
        }
      } else if (!readFailed && (savedUser || savedToken)) {
        
        await clearPersisted();
      }

      if (!cancelled) setIsAuthLoaded(true);
    }

    loadPersistedAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearPersisted = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      await deleteToken();
    } catch (err) {
      setStorageError(err);
    }
  }, []);

  const persistUser = useCallback(async (nextUser) => {
    const { token, ...withoutToken } = nextUser;
    await AsyncStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(withoutToken)
    );
    return token;
  }, []);

  const login = useCallback(
    async (userData) => {
      if (!userData?.token) {
        throw new Error('login requires a token');
      }

      
      try {
        const token = await persistUser(userData);
        await writeToken(token);
        setStorageError(null);
      } catch (err) {
        setStorageError(err);
        await clearPersisted();
        throw err;
      }

      tokenRef.current = userData.token;
      setUser(userData);
      setIsLoggedIn(true);
    },
    [persistUser, clearPersisted]
  );

  const logout = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    setIsLoggedIn(false);

    try {
      await clearPersisted();

      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
    } catch (err) {
      setStorageError(err);
    }
  }, [clearPersisted]);

  const updateUser = useCallback(
    async (updatedFields) => {
      let next = null;

     
      setUser((current) => {
        if (!current) return current;
        next = { ...current, ...updatedFields };
        return next;
      });

      if (!next) return;

      try {
        const token = await persistUser(next);

        
        if (token && token !== tokenRef.current) {
          await writeToken(token);
          tokenRef.current = token;
        }
        setStorageError(null);
      } catch (err) {
        setStorageError(err);
      }
    },
    [persistUser]
  );

  const getToken = useCallback(() => tokenRef.current, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      isAuthLoaded,
      storageError,
      login,
      logout,
      updateUser,
      getToken,
    }),
    [
      user,
      isLoggedIn,
      isAuthLoaded,
      storageError,
      login,
      logout,
      updateUser,
      getToken,
    ]
  );


  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}