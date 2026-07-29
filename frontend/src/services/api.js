import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const responseErr = {
      success: false,
      error_code: "NETWORK_ERROR",
      message: "An error occurred communicating with the server.",
      errors: []
    };

    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("app_currency_code");
      localStorage.removeItem("app_currency_symbol");
      localStorage.removeItem("app_language");
    }

    if (error.response && error.response.data) {
      // Use structured backend error format if available
      return Promise.reject(error.response.data);
    }

    return Promise.reject(responseErr);
  }
);

export default API;
