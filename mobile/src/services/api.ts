import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Backend host = the machine running `expo start` (same one serving the bundle to Expo Go).
// Falls back to localhost (web/simulator) when no hostUri is available.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
// Set EXPO_PUBLIC_API_URL (e.g. https://your-backend.vercel.app/api) to use the hosted backend.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost}:8000/api`;

export const tokens = {
  async getAccess() {
    return SecureStore.getItemAsync('access');
  },
  async getRefresh() {
    return SecureStore.getItemAsync('refresh');
  },
  async set(access: string, refresh?: string) {
    await SecureStore.setItemAsync('access', access);
    if (refresh) await SecureStore.setItemAsync('refresh', refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync('access');
    await SecureStore.deleteItemAsync('refresh');
  },
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (c) => {
  const access = await tokens.getAccess();
  if (access) c.headers.Authorization = `Bearer ${access}`;
  return c;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    const isAuthCall = orig?.url?.includes('/auth/');
    const refresh = await tokens.getRefresh();
    if (err.response?.status === 401 && !orig._retry && refresh && !isAuthCall) {
      orig._retry = true;
      refreshing ??= axios
        .post(`${API_URL}/auth/refresh/`, { refresh })
        .then(async (r) => {
          await tokens.set(r.data.access, r.data.refresh);
          return r.data.access as string;
        })
        .finally(() => {
          refreshing = null;
        });
      try {
        orig.headers.Authorization = `Bearer ${await refreshing}`;
        return api(orig);
      } catch {
        await tokens.clear();
      }
    }
    return Promise.reject(err);
  },
);

// Django list endpoints are inconsistent: a plain APIView returns a bare array, while
// anything built on DRF's generics.ListAPIView is paginated ({count, next, previous, results})
// because DEFAULT_PAGINATION_CLASS is set globally. This normalizes either shape to an array.
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export function errorMessage(e: unknown): string {
  const d = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>;
    if (typeof o.detail === 'string') return o.detail;
    return Object.entries(o)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : String(v)}`)
      .join('\n');
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

export default api;
