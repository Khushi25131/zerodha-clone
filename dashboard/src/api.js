import axios from "axios";
import { getToken, clearSession } from "./auth";
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3002",
  timeout: 10000,
});
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    clearSession();
    window.dispatchEvent(new Event("session-expired"));
  }
  return Promise.reject(error);
});
export const apiError = (error) => error.response?.data?.error || "Unable to reach the API. Please try again.";
