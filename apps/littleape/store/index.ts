import { AUTH_KEY, USER_COOKIE } from "constants/app";
import Cookies from "js-cookie";
import { PocketBaseManager } from "lib/pocketBaseManager";
import { User } from "types/User";
import create from "zustand";

export enum LoginMode {
  EMAIL,
  WALLET,
  FARCASTER,
  BLUESKY
}

interface AuthState {
  authorized: boolean;
  token?: string;
  user?: Partial<User>;
  mode: LoginMode;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setLoginMode: (mode: LoginMode) => void;
  logout: () => void;
}

const pbManager = PocketBaseManager.getInstance();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authorized: true,
  mode: LoginMode.EMAIL,
  setAuth: (token, user) => {
    Cookies.set(AUTH_KEY, token, { sameSite: "None", secure: true });
    Cookies.set(USER_COOKIE, JSON.stringify(user))
    set(() => ({
      token,
      user,
    }));
  },
  setUser: (user) => {
    set(() => ({
      user,
    }));
  },
  setLoginMode: (mode) => {
    set(() => ({
      mode,
    }));
  },
  logout: () => {
    Cookies.remove(AUTH_KEY);
    Cookies.remove(USER_COOKIE);
    pbManager.logout(); // Clear the PocketBase auth store
    set(() => ({
      token: undefined,
      user: undefined,
      address: undefined,
      authorized: false,
      mode: LoginMode.EMAIL,
    }));
  },
}));
