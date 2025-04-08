import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = req.query.instance as string;

    if (!instance || !/^https?:\/\/[a-zA-Z0-9.-]+$/.test(instance)) {
        return res.status(400).json({ error: "Invalid or missing instance URL" });
    }

    try {
        const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback`;

        console.log("Redirect URI: ", redirectUri)
        // Register app dynamically
        const registerRes = await fetch(`${instance}/api/v1/apps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_name: "LittleApe",
                redirect_uris: redirectUri,
                scopes: "read",
                website: "https://littleape.xyz"
            }),
        });

        if (!registerRes.ok) {
            const error = await registerRes.text();
            return res.status(500).json({ error: "App registration failed", detail: error });
        }

        const { client_id, client_secret } = await registerRes.json();

        const stateObj = { instance, client_id, client_secret };
        const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url"); // or encodeURIComponent

        const authUrl = `${instance}/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
            redirectUri + `?state=${state}`
        )}&response_type=code&scope=read&force_login=true`;

        return res.redirect(authUrl);
    } catch (err) {
        return res.status(500).json({ error: "Unexpected error", detail: (err as Error).message });
    }
}