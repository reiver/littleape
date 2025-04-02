import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = "https://mastodon.social"; // Change this for different instances
    const clientId = process.env.NEXT_PUBLIC_MASTODON_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback`;

    const authUrl = `${instance}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read&force_login=true`;

    res.redirect(authUrl);
}
