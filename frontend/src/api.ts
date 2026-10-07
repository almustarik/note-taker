const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string | { _id: string; name: string; email: string };
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  author?: string | { _id: string; name: string } | null;
  createdAt: string;
}

export interface InterestGroup {
  interest: string;
  count: number;
  users: { _id: string; name: string }[];
}

export interface Page<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

let activeAuthenticationToken: string | null = localStorage.getItem('token');

export function setToken(newTokenValue: string | null) {
  activeAuthenticationToken = newTokenValue;
  if (newTokenValue) {
    localStorage.setItem('token', newTokenValue);
  } else {
    localStorage.removeItem('token');
  }
}

export const hasToken = (): boolean => Boolean(activeAuthenticationToken);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function executeHttpRequest<T>(
  httpMethod: string,
  endpointPath: string,
  requestPayload?: unknown,
): Promise<T> {
  const httpResponse = await fetch(`${API_BASE_URL}${endpointPath}`, {
    method: httpMethod,
    headers: {
      ...(requestPayload ? { 'Content-Type': 'application/json' } : {}),
      ...(activeAuthenticationToken ? { Authorization: `Bearer ${activeAuthenticationToken}` } : {}),
    },
    body: requestPayload ? JSON.stringify(requestPayload) : undefined,
  });

  if (httpResponse.status === 204) {
    return undefined as T;
  }

  const parsedResponseBody = await httpResponse.json().catch(() => ({}));
  if (!httpResponse.ok) {
    const errorDetailsMessage = Array.isArray(parsedResponseBody.message)
      ? parsedResponseBody.message.join(', ')
      : parsedResponseBody.message;
    throw new ApiError(errorDetailsMessage ?? 'Network request failed', httpResponse.status);
  }

  return parsedResponseBody as T;
}

export const api = {
  get: <T>(endpointPath: string) => executeHttpRequest<T>('GET', endpointPath),
  post: <T>(endpointPath: string, requestPayload?: unknown) =>
    executeHttpRequest<T>('POST', endpointPath, requestPayload),
  patch: <T>(endpointPath: string, requestPayload?: unknown) =>
    executeHttpRequest<T>('PATCH', endpointPath, requestPayload),
  delete: (endpointPath: string) => executeHttpRequest<void>('DELETE', endpointPath),
};
