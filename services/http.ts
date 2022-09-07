import { API_UPLOAD, API_USER_PROFILE } from "constants/API";
import { AUTH_KEY } from "constants/app";
import Cookie from "js-cookie";
import { $fetch, FetchOptions } from "ohmyfetch";

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
      Accept:
        url.startsWith(API_USER_PROFILE("")) && "application/activity+json",
    },
  });

export const uploadFile = async (file: File) => {
  if (!(file && file instanceof File)) return new Promise((r) => r(undefined));

  const body = new FormData();
  body.append("file", file);
  return await fetcher(API_UPLOAD, {
    body,
    method: "post",
  }).then(({ url }) => url);
};
