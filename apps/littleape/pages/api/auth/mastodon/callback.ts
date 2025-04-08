import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  if (!code || !state) {
    const errorData = { error: "Missing code or state" };
    return res.redirect(`/auth/login?mastodonerror=${encodeURIComponent(JSON.stringify(errorData))}`);
  }

  const decodedState = JSON.parse(Buffer.from(state, "base64url").toString());

  console.log("Decoded Data: ", decodedState)

  if (!decodedState) {
    return res.status(400).json({ error: "Invalid or expired session" });
  }

  const { client_id, client_secret, instance } = decodedState;
  const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback?state=${state}`;

  try {
    // Exchange auth code for access token
    const tokenResponse = await fetch(`${instance}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: client_id as string,
        client_secret: client_secret as string,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code as string,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Failed to get access token", detail: tokenData });
    }

    // Get user info
    const userResponse = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    console.log("userData: ", userData);

    res.redirect(`/auth/login/?mastodonuser=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ error: "Callback failed", detail: (error as Error).message });
  }
}
