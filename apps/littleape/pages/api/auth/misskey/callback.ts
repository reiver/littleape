import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import logger from "lib/logger/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session } = req.query; // Retrieve session ID from the query params

  // Parse cookies
  const cookies = cookie.parse(req.headers.cookie || "");

  // Retrieve the state object from the cookie
  const state = cookies.misskey_state

  if (!state) {
    return res.status(400).json({ error: "State object not found in cookies" });
  }
  logger.log("State is: ", state)

  const instance = state

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
    logger.log("Misskey Login Response:", data);

    if (!data.token) {
      return res.redirect(`/auth/login?misskeyerror=${encodeURIComponent("Failed to get access token")}&misskeydata=${encodeURIComponent(JSON.stringify(data))}`);
    }

    // Fetch user data using the access token
    const userResponse = await fetch(`${instance}/api/i`, {
      method: " ",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ i: data.token }),
    });

    const userData = await userResponse.json();
    logger.log("Misskey User Data:", userData);

    const dataToSend = {
      id: userData.id,
      name: userData.name,
      username: userData.username,
      avatarUrl: userData.avatarUrl,
      onlineStatus: userData.onlineStatus,
      createdAt: userData.createdAt
    }
    // Redirect user to frontend with user data
    res.redirect(`/auth/login?misskeyuser=${encodeURIComponent(JSON.stringify(dataToSend))}`);
  } catch (error) {
    logger.error("Misskey MIAUTH Error:", error);
    res.redirect(`/auth/login?misskeyerror=${encodeURIComponent("Internal Server Error")}`);
  }
}
