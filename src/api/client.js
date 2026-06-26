import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const DEFAULT_ERROR_MESSAGE = "通信に失敗しました。時間をおいて再度お試しください。";
const AUTH_STORAGE_KEYS = [
  "token",
  "username",
  "accountId",
  "avatarUrl",
  "bio",
  "followingCount",
  "followersCount"
];
const LOGIN_PATHS = new Set(["/users/sign_in", "/users/sign_in.json"]);

let unauthorizedHandler = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

export const clearAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};

const getRequestPath = (config) => {
  try {
    return new URL(config?.url || "", config?.baseURL || API_BASE_URL).pathname;
  } catch {
    return config?.url || "";
  }
};

const isLoginRequest = (config) => LOGIN_PATHS.has(getRequestPath(config));

export const isUnauthorizedError = (error) => normalizeApiError(error).status === 401;

export const extractAuthToken = (authorization) => {
  if (!authorization) return null;

  const token = String(authorization).trim().replace(/^Bearer\s+/i, "");
  return token || null;
};

const isNormalizedApiError = (error) => (
  error &&
  typeof error === "object" &&
  "code" in error &&
  "message" in error &&
  "details" in error
);

export const normalizeApiError = (error, fallbackMessage = DEFAULT_ERROR_MESSAGE) => {
  if (isNormalizedApiError(error)) {
    return error;
  }

  const responseError = error?.response?.data?.error;

  if (responseError && typeof responseError === "object") {
    return {
      code: responseError.code || "api_error",
      message: responseError.message || fallbackMessage,
      details: responseError.details || {},
      status: error.response?.status,
      originalError: error
    };
  }

  if (error?.request) {
    return {
      code: "network_error",
      message: "サーバーと通信できませんでした。",
      details: {},
      status: null,
      originalError: error
    };
  }

  return {
    code: "unexpected_error",
    message: error?.message || fallbackMessage,
    details: {},
    status: null,
    originalError: error
  };
};

const formatDetailMessages = (details) => {
  if (!details || typeof details !== "object") return "";

  if (Array.isArray(details)) {
    return details.filter(Boolean).join("\n");
  }

  return Object.entries(details)
    .flatMap(([field, messages]) => {
      if (Array.isArray(messages)) {
        return messages.map((message) => `${field}: ${message}`);
      }

      if (typeof messages === "string") {
        return `${field}: ${messages}`;
      }

      return [];
    })
    .join("\n");
};

export const getApiErrorMessage = (error, fallbackMessage) => {
  const normalizedError = normalizeApiError(error, fallbackMessage);
  const detailMessage = formatDetailMessages(normalizedError.details);

  return detailMessage
    ? `${normalizedError.message}\n${detailMessage}`
    : normalizedError.message;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  config.headers = config.headers || {};
  config.headers.Accept = "application/json";

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  if (token && !isLoginRequest(config)) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error);

    if (error?.response?.status === 401 && !isLoginRequest(error.config)) {
      clearAuthSession();
      unauthorizedHandler?.(normalizedError);
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
