import { API_UPLOAD } from "constants/API";
import { AUTH_KEY } from "constants/app";
import Cookie from "js-cookie";
import { $fetch, FetchOptions as $FetchOptions } from "ohmyfetch";
import { useAuthStore } from "store";
import { joinURL } from "ufo";

type FetchOptions = { activity?: boolean } & $FetchOptions<"json">;

let token = Cookie.get(AUTH_KEY);

const fetch = $fetch.create({
  headers: token && {
    Authorization: `Bearer ${token}`,
  },
});

export const fetcher = <T = any>(
  url: string | [string, FetchOptions],
  options: FetchOptions = {}
) => {
  let token = useAuthStore.getState().token;
  // if the url was an array, set the first item as url and the second item as option
  if (Array.isArray(url)) {
    options = { ...url[1], ...options };
    url = url[0];
  }
  if (!options.headers) options.headers = {};
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  if (options.activity) {
    options.headers["Accept"] = "application/activity+json";
  }

  // if the url does not contain protocol, add app base api to it
  if (!new RegExp("^(?:[a-z]+:)?//", "i").test(url))
    url = joinURL(process.env.NEXT_PUBLIC_API_BASE_URI, url);
  return fetch<T>(url, options);
};

export const uploadFile = async (file: File) => {
  if (!(file && file instanceof File)) return new Promise((r) => r(undefined));

  const body = new FormData();
  body.append("file", file);
  return await fetcher<{ url: string }>(API_UPLOAD, {
    body,
    method: "post",
  }).then(({ url }) => url);
};
