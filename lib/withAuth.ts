import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { AUTH_KEY } from "constants/app";
import { API_PROFILE } from "constants/API";
import { User } from "types/User";
import { fetch } from "services/http";

type WithAuthContext = {
  user?: User;
  token?: string;
} & GetServerSidePropsContext;

export type WithAuthType = (
  cb: (ctx: WithAuthContext) => GetServerSidePropsResult<any>
) => (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<any>>;

export const withAuth: WithAuthType = (cb) => async (ctx) => {
  const context: WithAuthContext = ctx;
  const token = ctx.req.cookies[AUTH_KEY];
  let user;
  if (token)
    try {
      // abort the request after 5 sec
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      user = await fetch(API_PROFILE, {
        // signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      context.user = user;
      context.token = token;
    } catch (e) {
      // delete ${AUTH_KEY} cookie as it is invalid and to disable auth check
      ctx.res.setHeader("Set-Cookie", [
        `${AUTH_KEY}=deleted; Max-Age=0; path=/`,
      ]);
    }

  // if user is valid and wants to go to the auth page, redirect to /
  if (user && context.resolvedUrl.startsWith("/auth/")) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  // if user is not valid and wants to open the app, redirect to login
  if (!user && context.resolvedUrl == "/") {
    return {
      redirect: {
        permanent: false,
        destination: "/auth/login",
      },
    };
  }
  return cb(context);
};

export const authProps = (ctx: WithAuthContext) => {
  const { user, token } = ctx;
  if (user) return { user, token };
  return {};
};
