export default async function handler(req, res) {
    const { code } = req.query;
    const instance = "https://pixelfed.social"; // Change as needed
    const clientId = process.env.NEXT_PUBLIC_PIXELFED_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_PIXELFED_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/pixelfed/callback`;

    try {
        if (!code) {
            return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Missing authorization code" }))}`);
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
        console.log("PIXEl FED TOKEN DATA: ", tokenData)
        if (!tokenData.access_token) {
            return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Failed to get access token" }))}`);
        }

        // Fetch user data from PixelFed
        const userResponse = await fetch(`https://pixelfed.social/api/v1/accounts/verify_credentials`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userResponse.json();

        // Redirect to frontend with user data
        res.redirect(`/auth/login?pixelfeduser=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.error("OAuth Error:", error);
        res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Internal Server Error" }))}`);
    }
}
