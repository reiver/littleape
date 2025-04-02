import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const instance = "https://mastodon.social"; // Change as needed
  const clientId = process.env.NEXT_PUBLIC_MASTODON_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_MASTODON_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/mastodon/callback`;

  if (!code) {
    const errorData = { error: "Missing authorization code" };
    res.redirect(`/auth/login?mastodonerror=${encodeURIComponent(JSON.stringify(errorData))}`);
  }

  const tokenResponse = await fetch(`${instance}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: code as string,
    }),
  });

  const tokenData = await tokenResponse.json();
  console.log("OAuth Token Response:", tokenData);
  if (!tokenData.access_token) return res.status(400).json({ error: "Failed to get access token" });

  const userResponse = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const userData = await userResponse.json();

  console.log("userData: ", userData)
  res.redirect(`/auth/login/?mastodonuser=${encodeURIComponent(JSON.stringify(userData))}`);
}
