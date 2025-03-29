import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const instance = "https://mastodon.social"; // Change this for different instances
  const clientId = process.env.MASTODON_CLIENT_ID;
  const redirectUri = "http://localhost:3001/api/auth/mastodon/callback";

  const authUrl = `${instance}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read&force_login=true`;

  res.redirect(authUrl);
}
