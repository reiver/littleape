// export default async function handler(req, res) {
//     const { code } = req.query;
//     const instance = "https://pixelfed.social"; // Change as needed
//     const clientId = process.env.NEXT_PUBLIC_PIXELFED_CLIENT_ID;
//     const clientSecret = process.env.NEXT_PUBLIC_PIXELFED_CLIENT_SECRET;
//     const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/pixelfed/callback`;

//     try {
//         if (!code) {
//             return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Missing authorization code" }))}`);
//         }

//         const tokenResponse = await fetch(`${instance}/oauth/token`, {
//             method: "POST",
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//             body: new URLSearchParams({
//                 client_id: clientId!,
//                 client_secret: clientSecret!,
//                 grant_type: "authorization_code",
//                 redirect_uri: redirectUri,
//                 code: code as string,
//             }),
//         });

//         const tokenData = await tokenResponse.json();
//         logger.log("PIXEl FED TOKEN DATA: ", tokenData)
//         if (!tokenData.access_token) {
//             return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Failed to get access token" }))}`);
//         }

//         // Fetch user data from PixelFed
//         const userResponse = await fetch(`https://pixelfed.social/api/v1/accounts/verify_credentials`, {
//             headers: { Authorization: `Bearer ${tokenData.access_token}` },
//         });

//         const userData = await userResponse.json();

//         // Redirect to frontend with user data
//         res.redirect(`/auth/login?pixelfeduser=${encodeURIComponent(JSON.stringify(userData))}`);
//     } catch (error) {
//         logger.error("OAuth Error:", error);
//         res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Internal Server Error" }))}`);
//     }
// }


import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import logger from "lib/logger/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { code } = req.query;

    // Parse cookies
    const cookies = cookie.parse(req.headers.cookie || "");

    // Retrieve the state object from the cookie
    const state = cookies.pixelfed_state ? JSON.parse(cookies.pixelfed_state) : null;

    if (!state) {
        return res.status(400).json({ error: "State object not found in cookies" });
    }
    logger.log("State is: ", state)
    logger.log("code is: ", code)

    if (!code || !state) {
        const errorData = { error: "Missing code or state" };
        return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify(errorData))}`);
    }

    const { client_id, client_secret, instance } = state;
    const redirectUri = `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/api/auth/pixelfed/callback`;

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

        logger.log("Token Data: ",tokenData)

        if (!tokenData.access_token) {
            return res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Failed to get access token" }))}`);
        }

        // Fetch user data from PixelFed
        const userResponse = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userResponse.json();

        logger.log("userData: ", userData);

        // Redirect to frontend with user data
        res.redirect(`/auth/login?pixelfeduser=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        logger.error("OAuth Error:", error);
        res.redirect(`/auth/login?pixelfederror=${encodeURIComponent(JSON.stringify({ error: "Internal Server Error" }))}`);
    }
}
