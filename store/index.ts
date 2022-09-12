import { API_PROFILE } from "constants/API";
import { AUTH_KEY } from "constants/app";
import Cookies from "js-cookie";
import { fetch } from "services/http";
import { User } from "types/User";
import create from "zustand";

interface AuthState {
  authorized: boolean;
  token?: string;
  user?: Partial<User>;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authorized: false,
  fetchUser: () => {
    fetch(API_PROFILE);
  },
  setAuth: (token, user) => {
    Cookies.set(AUTH_KEY, token);
    set(() => ({
      token,
      user,
    }));
  },
  logout: () => {
    Cookies.remove(AUTH_KEY);
  },
}));
