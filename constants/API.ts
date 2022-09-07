import { joinURL } from "ufo";

export const API_LOGIN = "/api/v1/login";
export const API_SIGN_UP = "/api/v1/signup";
export const API_PROFILE = "/api/v1/profile";
export const API_USER_PROFILE = (username: string) => `/u/${username}`;
export const API_UPLOAD = "/upload";
export const API_OUTBOX = (username) => joinURL("/u/", username, "/outbox");
export const HOST = process.env.NEXT_PUBLIC_HOST;
