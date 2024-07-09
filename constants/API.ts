// export const API_LOGIN = "/api/v1/login";
// export const API_SIGN_UP = "/api/v1/signup";
// export const API_VERIFY_SIGN_UP = "/api/v1/verify";
// export const API_PROFILE = "/api/v1/profile";
export const API_USER_PROFILE = (username: string) => `/u/${username}`;
// export const API_USER_FOLLOWERS = (username: string) => `/u/${username}/followers`;
// export const API_USER_FOLLOWING = (username: string) => `/u/${username}/following`;
// export const API_UPLOAD = "/upload";
// export const API_OUTBOX = (username) => joinURL("/u/", username, "/outbox");
// export const API_INBOX = (username) => joinURL("/u/", username, "/inbox");
export const HOST = process.env.NEXT_PUBLIC_HOST;

export const API_LOGIN = "Login endpoint mock data";

export const API_SIGN_UP = "Sign up endpoint mock data";

export const API_VERIFY_SIGN_UP = "Verify sign up endpoint mock data";

export const API_PROFILE = "Profile endpoint mock data";

export const API_USER_FOLLOWERS = (username: string) => `Followers for user ${username} mock data`;

export const API_USER_FOLLOWING = (username: string) => `Following for user ${username} mock data`;

export const API_UPLOAD = "Upload endpoint mock data";

export const API_OUTBOX = (username: string) => `Outbox for user ${username} mock data`;

export const API_INBOX = (username: string) => `Inbox for user ${username} mock data`;
