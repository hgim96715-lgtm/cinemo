import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from "./auth-session";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3050";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const { accessToken } = await getAuthTokens();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (respose) => respose,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const { refreshToken } = await getAuthTokens();

    if (!refreshToken) {
      await clearAuthTokens();
      return Promise.reject(error);
    }

    try {
      const response = await axios.post<RefreshResponse>(
        `${API_URL}/v1/auth/refresh`,
        { refreshToken },
      );

      await saveAuthTokens(response.data);

      originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);
