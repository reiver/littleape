import {
  API_INBOX,
  API_OUTBOX,
  API_USER_FOLLOWERS,
  API_USER_FOLLOWING,
  API_USER_PROFILE,
} from "constants/API";

export const FETCH_USER_OUTBOX = (username) => API_OUTBOX(username);
export const FETCH_USER_INBOX = (username) => API_INBOX(username);

export const FETCH_USER_FOLLOWERS = (user: { username?: string }) =>
  user && [API_USER_FOLLOWERS(user.username), { activity: true }];

export const FETCH_USER_FOLLOWING = (user: { username?: string }) =>
  user && [API_USER_FOLLOWING(user.username), { activity: true }];

export const FETCH_USER_PROFILE = (username) => [
  API_USER_PROFILE(String(username)),
  { activity: true },
];
