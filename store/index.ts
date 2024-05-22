import { AUTH_KEY } from "constants/app";
import Cookies from "js-cookie";
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
  // user:{
  //   api_key:"",
  //   avatar:"",
  //   banner:"",
  //   bio:"",
  //   display_name:"",
  //   email:"",
  //   github:"",
  //   id:0,
  //   publicKey:"",
  //   username:"zaid"
  // },
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
