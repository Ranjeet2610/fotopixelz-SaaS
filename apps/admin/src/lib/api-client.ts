"use client";

import type { ApiEnvelope, SessionUser } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5000/api/v1";

export const TOKEN_STORAGE_KEY = "fotopixelz.admin.accessToken";
export const USER_STORAGE_KEY = "fotopixelz.admin.user";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function saveUser(user: SessionUser) {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSessionStorage() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}) {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = options.token ?? getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), init);
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};

  if (!response.ok || parsed.success === false) {
    throw new ApiError(response.status, extractErrorMessage(parsed, response.statusText));
  }

  return (parsed.data ?? parsed) as T;
}

function extractErrorMessage(payload: ApiEnvelope<unknown>, fallback: string) {
  if (payload.message) {
    return payload.message;
  }

  if (payload.errors) {
    return "Please check the highlighted form values.";
  }

  return fallback || "Request failed";
}
