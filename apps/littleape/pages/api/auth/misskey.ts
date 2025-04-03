import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = "https://mk.godspeed.moe";
    const baseUrl = process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL;

    if (!instance || !baseUrl) {
        return res.status(500).json({ error: "Missing environment variables" });
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Construct the MIAUTH URL
    const authUrl = `${instance}/miauth/${sessionId}?name=littleape&callback=${encodeURIComponent(`${baseUrl}/api/auth/misskey/callback`)}&permission=read:account`;

    // Redirect the user to Misskey
    res.redirect(authUrl);
}
