import axios from "axios";
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3002",
  timeout: 10000,
});
export const apiError = (error) => error.response?.data?.error || "Unable to reach the API. Please try again.";
