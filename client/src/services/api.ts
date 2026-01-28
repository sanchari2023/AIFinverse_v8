// services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV
  ? "https://api.aifinverse.com"
  : "https://api.aifinverse.com";

// Main API instance (for JSON requests)
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  withCredentials: false,
});

// Form data API instance (for x-www-form-urlencoded)
export const apiForm: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  withCredentials: false,
});

// Request interceptor for JSON API
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`[JSON] Making ${config.method?.toUpperCase()} request to:`, config.url);

    // ✅ ADD THIS BLOCK
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const timestamp = Date.now();
    if (config.method?.toLowerCase() === 'get') {
      config.params = { ...config.params, _t: timestamp };
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[JSON] Request error:", error);
    return Promise.reject(error);
  }
);


// Response interceptor for JSON API
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[JSON] ✅ Response:", response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error("[JSON] ❌ Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Request interceptor for FORM API
apiForm.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`[FORM] Making ${config.method?.toUpperCase()} request to:`, config.url);
    
    // Convert data object to URLSearchParams if it's not already a string
    if (config.data && typeof config.data === 'object' && !(config.data instanceof URLSearchParams)) {
      const params = new URLSearchParams();
      Object.entries(config.data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      config.data = params.toString();
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error("[FORM] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for FORM API
apiForm.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[FORM] ✅ Response:", response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error("[FORM] ❌ Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);