import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { session } = req.query; // Retrieve session ID from the query params
    const instance = "https://mk.godspeed.moe"

    if (!session || typeof session !== "string") {
        return res.redirect(`/auth/login?misskeyerror=${encodeURIComponent("Missing session ID")}`);
    }

    try {
        // Fetch the access token for the session
        const response = await fetch(`${instance}/api/miauth/${session}/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // Send an empty JSON object
        });

        const data = await response.json();
        console.log("Misskey Login Response:", data);

        if (!data.token) {
            return res.redirect(`/auth/login?misskeyerror=${encodeURIComponent("Failed to get access token")}&misskeydata=${encodeURIComponent(JSON.stringify(data))}`);
        }

        // Fetch user data using the access token
        const userResponse = await fetch(`${instance}/api/i`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ i: data.token }),
        });

        const userData = await userResponse.json();
        console.log("Misskey User Data:", userData);

        // Redirect user to frontend with user data
        res.redirect(`/auth/login?misskeyuser=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.error("Misskey MIAUTH Error:", error);
        res.redirect(`/auth/login?misskeyerror=${encodeURIComponent("Internal Server Error")}`);
    }
}
