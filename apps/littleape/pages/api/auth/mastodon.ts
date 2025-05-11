import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = req.query.instance as string;

    if (!instance || !/^https?:\/\/[a-zA-Z0-9.-]+$/.test(instance)) {
        return res.status(400).json({ error: "Invalid or missing instance URL" });
    }

    try {
        const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback`;
        const clientName = `${process.env.NEXT_PUBLIC_CLIENT_NAME} (${process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN})`

        console.log("Redirect URI: ", redirectUri)
        // Register app dynamically
        const registerRes = await fetch(`${instance}/api/v1/apps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_name: clientName,
                redirect_uris: redirectUri,
                scopes: "profile write:statuses",
                website: process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL
            }),
        });

        if (!registerRes.ok) {
            const error = await registerRes.text();
            return res.status(500).json({ error: "App registration failed", detail: error });
        }

        const { client_id, client_secret } = await registerRes.json();

        const stateObj = { instance, client_id, client_secret };

        const authUrl = `${instance}/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&response_type=code&scope=${encodeURIComponent("profile write:statuses")}&force_login=true`;

        // Set cookie with state data
        res.setHeader(
            "Set-Cookie",
            `mastodon_state=${JSON.stringify(stateObj)}; Path=/; HttpOnly; Secure; Max-Age=3600`
        );


        return res.redirect(authUrl);
    } catch (err) {
        return res.status(500).json({ error: "Unexpected error", detail: (err as Error).message });
    }
}