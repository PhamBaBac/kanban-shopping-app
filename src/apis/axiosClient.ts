/** @format */

import axios from "axios";
import queryString from "query-string";
import Router from "next/router";
import { localDataNames } from "../constants/appInfos";
import { addAuth, removeAuth } from "../redux/reducers/authReducer";
import { store } from "../redux/store";
import { getErrorMessage } from "../utils/errorHandler";

const baseURL = `http://localhost:8080/api/v1`;

let isRedirectingTo500 = false;

export const trigger500Redirect = () => {
  if (typeof window === "undefined" || isRedirectingTo500) return;
  const currentPath = window.location.pathname;
  if (currentPath.includes("/500")) return;

  isRedirectingTo500 = true;
  setTimeout(() => {
    isRedirectingTo500 = false;
  }, 2500);

  try {
    Router.replace("/500");
  } catch {
    window.location.href = "/500";
  }
};

const getAuthData = () => {
  try {
    if (typeof window === "undefined") {
      return null;
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
  return authData?.accessToken || "";
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
      {
        withCredentials: true,
        headers: {
          "X-Client-Type": "user",
        },
      }
    );

    const newToken = response.data.accessToken;

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
    const originalRequest = error?.config;

    const formatRejectedError = (err: any) => {
      const localizedMessage = getErrorMessage(err);
      if (err.response?.data && typeof err.response.data === "object") {
        return {
          ...err.response.data,
          message: localizedMessage,
        };
      }
      return {
        message: localizedMessage,
        originalError: err,
      };
    };

    if (!originalRequest || !originalRequest.url) {
      return Promise.reject(formatRejectedError(error));
    }

    const isLoginRequest =
      originalRequest.url?.includes("/auth/authenticate") ||
      originalRequest.url?.includes("/auth/exchange-token") ||
      originalRequest.url?.includes("/auth/login");
    const isRefreshRequest = originalRequest.url?.includes(
      "/auth/refresh-token"
    );

    if (isLoginRequest || isRefreshRequest) {
      return Promise.reject(formatRejectedError(error));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        if (!newToken) return Promise.reject(formatRejectedError("Phiên đăng nhập đã hết hạn"));

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(formatRejectedError(refreshError));
      }
    }

    const isServerErrorOrOffline =
      !error.response ||
      (error.response?.status >= 500 && error.response?.status <= 599);

    if (isServerErrorOrOffline && !isLoginRequest && !isRefreshRequest) {
      trigger500Redirect();
    }

    return Promise.reject(formatRejectedError(error));
  }
);

export default axiosClient;
