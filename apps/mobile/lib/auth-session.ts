import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_SERVICE = "com.cinemo.auth";

const NATIVE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

const WEB_KEYS = {
  ACCESS_TOKEN: "cinemo.access-token",
  REFRESH_TOKEN: "cinemo.refresh-token",
  USER: "cinemo.user",
} as const;

export type AuthUserSession = {
  nickname: string;
};

const options: SecureStore.SecureStoreOptions = {
  keychainService: AUTH_SERVICE,
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function getWebStorage(): Storage | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export async function saveAuthTokens(tokens: AuthTokens) {
  const storage = getWebStorage();

  if (storage) {
    storage.setItem(WEB_KEYS.ACCESS_TOKEN, tokens.accessToken);
    storage.setItem(WEB_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(
      NATIVE_KEYS.ACCESS_TOKEN,
      tokens.accessToken,
      options,
    ),
    SecureStore.setItemAsync(
      NATIVE_KEYS.REFRESH_TOKEN,
      tokens.refreshToken,
      options,
    ),
  ]);
}

export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const storage = getWebStorage();

  if (storage) {
    return {
      accessToken: storage.getItem(WEB_KEYS.ACCESS_TOKEN),
      refreshToken: storage.getItem(WEB_KEYS.REFRESH_TOKEN),
    };
  }

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(NATIVE_KEYS.ACCESS_TOKEN, options),
    SecureStore.getItemAsync(NATIVE_KEYS.REFRESH_TOKEN, options),
  ]);

  return {
    accessToken,
    refreshToken,
  };
}

export async function clearAuthTokens() {
  const storage = getWebStorage();

  if (storage) {
    storage.removeItem(WEB_KEYS.ACCESS_TOKEN);
    storage.removeItem(WEB_KEYS.REFRESH_TOKEN);
    storage.removeItem(WEB_KEYS.USER);
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(NATIVE_KEYS.ACCESS_TOKEN, options),
    SecureStore.deleteItemAsync(NATIVE_KEYS.REFRESH_TOKEN, options),
    SecureStore.deleteItemAsync(NATIVE_KEYS.USER, options),
  ]);
}

export async function saveAuthUser(user: AuthUserSession) {
  const storage = getWebStorage();
  const value = JSON.stringify(user);
  if (storage) {
    storage.setItem(WEB_KEYS.USER, value);
    return;
  }

  await SecureStore.setItemAsync(NATIVE_KEYS.USER, value, options);
}

export async function getAuthUser(): Promise<AuthUserSession | null> {
  const storage = getWebStorage();

  const value = storage
    ? storage.getItem(WEB_KEYS.USER)
    : await SecureStore.getItemAsync(NATIVE_KEYS.USER, options);

  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUserSession;
  } catch {
    return null;
  }
}
