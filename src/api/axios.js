import axios from "axios";
import { handleUnauthorized, handleForbidden } from "../lib/auth-utils";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        handleUnauthorized(error.config?.url || "");
      } else if (error.response.status === 403) {
        handleForbidden();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
