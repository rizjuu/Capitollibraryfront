import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes("/auth/");
    if (error.response && error.response.status === 401 && !isAuthRequest) {
      const isSessionTerminated = error.response.data?.code === "SESSION_TERMINATED" || error.response.data?.sessionTerminated;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      if (isSessionTerminated) {
        sessionStorage.setItem(
          "session_terminated_alert",
          "You were signed out because your account was logged in from another device or browser. Only one active session is allowed."
        );
      }

      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;