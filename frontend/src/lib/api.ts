"use client";

import axios from "axios";
import type { ApiResponse } from "@/lib/types";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const isBrowser = typeof window !== "undefined";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  if (!isBrowser) return config;
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function apiError(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const message = error.response?.data?.success === false
      ? error.response.data.error
      : error.message;
    return new Error(message);
  }
  return error;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!isBrowser || error.response?.status !== 401 || original?._retry) throw apiError(error);
    original._retry = true;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw apiError(error);
    try {
      const response = await axios.post<ApiResponse<{ accessToken: string }>>(`${baseURL}/api/auth/refresh`, {
        refreshToken
      });
      if (!response.data.success) throw new Error(response.data.error);
      localStorage.setItem("accessToken", response.data.data.accessToken);
      original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      throw apiError(refreshError);
    }
  }
);

export function unwrap<T>(response: { data: ApiResponse<T> }) {
  if (!response.data.success) throw new Error(response.data.error);
  return response.data.data;
}
