import { User } from "types/User";
import create from "zustand";
import Cookies from "js-cookie";
import { AUTH_KEY } from "constants/app";
import { fetch } from "services/http";
import { API_PROFILE } from "constants/API";

interface AuthState {
  authorized: boolean;
  token?: string;
  user?: User;
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
