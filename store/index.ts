import { AUTH_KEY } from "constants/app";
import Cookies from "js-cookie";
import { PocketBaseManager } from "lib/pocketBaseManager";
import { User } from "types/User";
import create from "zustand";

interface AuthState {
  authorized: boolean;
  token?: string;
  user?: Partial<User>;
  loginViaWallet: Boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setLoginMode: (viaWallet: Boolean) => void;
  logout: () => void;
}

const pbManager = PocketBaseManager.getInstance();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authorized: true,
  loginViaWallet: false,
  setAuth: (token, user) => {
    Cookies.set(AUTH_KEY, token, { sameSite: "None", secure: true });
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
  setLoginMode: (loginViaWallet) => {
    set(() => ({
      loginViaWallet,
    }));
  },
  logout: () => {
    Cookies.remove(AUTH_KEY);
    pbManager.logout(); // Clear the PocketBase auth store
    set(() => ({
      token: undefined,
      user: undefined,
      address: undefined,
      authorized: false,
      loginViaWallet: false,
    }));
  },
}));
