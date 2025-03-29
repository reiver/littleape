import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = "https://pixelfed.social"; // Change this for different instances
    const clientId = process.env.PIXELFED_CLIENT_ID;
    const redirectUri = `${process.env.LITTLEAPE_BASE_URL}/api/auth/pixelfed/callback`;

    const authUrl = `${instance}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read&force_login=true&prompt=login`;

    res.redirect(authUrl);
}
