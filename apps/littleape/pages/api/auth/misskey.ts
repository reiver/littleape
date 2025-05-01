import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = req.query.instance as string;
    const baseUrl = process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL;
    const clientName = `${process.env.NEXT_PUBLIC_CLIENT_NAME} (${process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN})`

    if (!instance || !baseUrl) {
        return res.status(500).json({ error: "Missing environment variables" });
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Construct the MIAUTH URL
    const authUrl = `${instance}/miauth/${sessionId}?name=${clientName}&callback=${encodeURIComponent(`${baseUrl}/api/auth/misskey/callback`)}&permission=read:account`;

    // Set cookie with state data
    res.setHeader(
        "Set-Cookie",
        `misskey_state=${instance}; Path=/; HttpOnly; Secure; Max-Age=3600`
    );

    // Redirect the user to Misskey
    res.redirect(authUrl);
}
