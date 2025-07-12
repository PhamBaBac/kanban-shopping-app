/** @format */

import axios from "axios";
import queryString from "query-string";
import { localDataNames } from "../constants/appInfos";
import { addAuth, removeAuth } from "../redux/reducers/authReducer";
import { store } from "../redux/store";

const baseURL = `http://localhost:8080/api/v1`;

const getAuthData = () => {
  try {
    if (typeof window === "undefined") {
      return null; // Server-side rendering
    }
    const res = localStorage.getItem(localDataNames.authData);
    if (res) return JSON.parse(res);
    return null;
  } catch (error) {
    return null;
  }
};

const getAccessToken = () => {
  const authData = getAuthData();
  return authData?.accessToken || ""; // ✅ dùng đúng key accessToken
};

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response: any = await axios.post(
      `${baseURL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );

    const newToken = response.data.accessToken;

    // Only update localStorage and Redux store on client-side
    if (typeof window !== "undefined") {
      const currentAuthData = getAuthData();

      if (currentAuthData) {
        const updatedAuthData = {
          ...currentAuthData,
          accessToken: newToken,
        };
        localStorage.setItem(
          localDataNames.authData,
          JSON.stringify(updatedAuthData)
        );
        store.dispatch(addAuth(updatedAuthData));
      }
    }

    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    // Only clear auth on client-side
    if (typeof window !== "undefined") {
      localStorage.removeItem(localDataNames.authData);
      store.dispatch(removeAuth({}));
    }
    return null;
  } finally {
    isRefreshing = false;
  }
};

const axiosClient = axios.create({
  baseURL,
  paramsSerializer: (params) => queryString.stringify(params),
});

axiosClient.interceptors.request.use((config: any) => {
  const token = getAccessToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }

  return { ...config, data: config.data ?? null };
});

axiosClient.interceptors.response.use(
  (res) => {
    if (res.data && res.status >= 200 && res.status < 300) {
      return res.data;
    }
    throw new Error("Request failed");
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if originalRequest exists and has url property
    if (!originalRequest || !originalRequest.url) {
      return Promise.reject(error.response?.data || error.message);
    }

    const isLoginRequest = originalRequest.url?.includes("/auth/authenticate");
    const isRefreshRequest = originalRequest.url?.includes(
      "/auth/refresh-token"
    );

    if (isLoginRequest || isRefreshRequest) {
      return Promise.reject(error.response?.data || error.message);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        if (!newToken) return Promise.reject("Unable to refresh token");

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
