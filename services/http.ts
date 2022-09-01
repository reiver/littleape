import { $fetch, FetchOptions } from "ohmyfetch";
import Cookie from "js-cookie";
import { AUTH_KEY } from "constants/app";

const token = Cookie.get(AUTH_KEY);

export const fetch = $fetch.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URI,
  headers: token && {
    Authorization: `Bearer ${token}`,
  },
});

export const fetcher = (url: string, options?: FetchOptions) =>
  fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
