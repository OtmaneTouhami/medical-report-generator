import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 30000,
});

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === "Network Error" || !error.response) {
      console.error("Network issue detected. This might be blocked by browser security features.");
    }
    return Promise.reject(error);
  }
);

export default api;
