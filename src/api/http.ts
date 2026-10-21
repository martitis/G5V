import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { apiUrl } from "@/config";

/** An API call that failed: `message` is the server's message when it sent one. */
export class ApiError extends Error {
  /** HTTP status, or 0 when the server couldn't be reached. */
  status: number;
  /** The response body, when there was one. */
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const http = axios.create({
  headers: { "Content-Type": "application/json" },
  // Session cookie (Steam/local login) is sent to the API.
  withCredentials: true,
  timeout: 30000
});

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (error.response) {
      return new ApiError(
        data?.message || `Request failed (${error.response.status}).`,
        error.response.status,
        data
      );
    }
    return new ApiError("Could not reach the server. Please try again.", 0, undefined);
  }
  return new ApiError(error instanceof Error ? error.message : String(error), 0, undefined);
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<T>({ ...config, url: apiUrl(config.url) });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export const get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "get", url });
export const post = <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "post", url, data });
export const put = <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "put", url, data });
export const del = <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "delete", url, data });

/** A response's message, for APIs that answer `{ message }`. */
export interface MessageResponse {
  message: string;
  [key: string]: unknown;
}

/**
 * For list endpoints that answer 404 when there is nothing to list: returns `fallback` instead of throwing.
 * Other errors are still thrown.
 */
export async function orEmpty<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return fallback;
    throw error;
  }
}
