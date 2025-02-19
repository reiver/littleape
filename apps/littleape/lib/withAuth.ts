import { API_PROFILE } from "constants/API";
import { AUTH_KEY } from "constants/app";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { serverFetch } from "services/http.server";
import { User } from "types/User";

type WithAuthContext = {
  user?: User;
  token?: string;
} & GetServerSidePropsContext;

export type WithAuthType = (
  shouldAuthenticated: "authorized" | "notAuthorized" | "guest-authorized",
  cb: (
    ctx: WithAuthContext
  ) => Promise<GetServerSidePropsResult<any>> | GetServerSidePropsResult<any>
) => (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<any>>;

export const withAuth: WithAuthType = (authorizationType, cb) => async (ctx) => {
  const context: WithAuthContext = ctx;
  const token = ctx.req.cookies[AUTH_KEY];
  let user;
  if (token)
    try {
      user = await serverFetch(API_PROFILE, ctx.req);
      context.user = user;
      context.token = token;
    } catch (e) {
      // delete ${AUTH_KEY} cookie as it is invalid and to disable auth check
      ctx.res.setHeader("Set-Cookie", [`${AUTH_KEY}=deleted; Max-Age=0; path=/`]);
    }

  // if user is valid and wants to go to the auth page, redirect to /
  if (user && authorizationType == "notAuthorized") {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  // if user is not valid and wants to open the app, redirect to login
  if (!user && authorizationType == "authorized") {
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
