import { AUTH_KEY } from "constants/app";
import Cookie from "js-cookie";
import { $fetch } from "ohmyfetch";

const token = Cookie.get(AUTH_KEY);

const fetch$ = $fetch.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URI,
  headers: token && {
    Authorization: `Bearer ${token}`,
  },
});

export const fetch = (
  request: string,
  req: {
    cookies: Partial<{
      [key: string]: string;
    }>;
  },
  opts: {
    activityPub?: boolean;
    [key: string]: any;
  } = {}
) => {
  const token = req.cookies[AUTH_KEY];
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const { activityPub = false } = opts;
  if (activityPub)
    opts.headers = {
      ...(opts.headers || {}),
      "Content-Type": "application/activity+json",
    };
  return fetch$(request, {
    signal: controller.signal,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    ...opts,
  });
};
