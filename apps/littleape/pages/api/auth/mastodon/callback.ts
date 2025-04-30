import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  // Parse cookies
  const cookies = cookie.parse(req.headers.cookie || "");

  // Retrieve the state object from the cookie
  const state = cookies.mastodon_state ? JSON.parse(cookies.mastodon_state) : null;

  if (!state) {
    return res.status(400).json({ error: "State object not found in cookies" });
  }

  console.log("State is: ", state)

  if (!code || !state) {
    const errorData = { error: "Missing code or state" };
    return res.redirect(`/auth/login?mastodonerror=${encodeURIComponent(JSON.stringify(errorData))}`);
  }

  const { client_id, client_secret, instance } = state;
  const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback`;

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
