import Cookies from "js-cookie";

export const AUTH_KEY = "AUTH_TOKEN";
export const USER_COOKIE = "USER_COOKIE";
export const FORCE_LOGIN = "FORCE_LOGIN";

export const clearCookies = () => {
    Cookies.set(USER_COOKIE, null)
    Cookies.set(FORCE_LOGIN, null)
    Cookies.set(AUTH_KEY, null)
}