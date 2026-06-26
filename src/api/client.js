import axios from "axios";

export const API_BASE_URL = "http://localhost:3000";

const DEFAULT_ERROR_MESSAGE = "通信に失敗しました。時間をおいて再度お試しください。";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

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

  config.headers.Accept = "application/json";

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export default api;
