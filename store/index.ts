import { AUTH_KEY } from "constants/app";
import Cookies from "js-cookie";
import { PocketBaseManager } from "lib/pocketBaseManager";
import { User } from "types/User";
import create from "zustand";

interface AuthState {
  authorized: boolean;
  token?: string;
  user?: Partial<User>;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const pbManager = PocketBaseManager.getInstance();

export const useAuthStore = create<AuthState>((set) => ({
  user: pbManager.fetchUser(),  
  authorized: true,
  setAuth: (token, user) => {
    Cookies.set(AUTH_KEY, token, { sameSite: "None", secure: true });
    set(() => ({
      token,
      user,
    }));
  },
  logout: () => {
    Cookies.remove(AUTH_KEY);
  },
}));
