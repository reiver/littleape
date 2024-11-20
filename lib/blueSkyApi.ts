// src/lib/api.ts
import { AtpAgent } from "@atproto/api";

// Initialize the agent
export const agent = new AtpAgent({
  service: "https://bsky.social", // Main service URL
});

export const fetchProfile = async (identifier: string) => {
  const profile = await agent.getProfile({ actor: identifier })
  console.log("Profile: ", profile)

  return profile
}

// Function to authenticate and set up a session
export const createSession = async (identifier: string, password: string) => {
  try {
    const response = await agent.login({
      identifier,
      password,
    });

    console.log("Session created successfully:", response.data);
    return response;

  } catch (error) {
    console.error("Failed to create session:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await agent.logout();

   

    console.log("Logout successfully:", response);
    return response;

  } catch (error) {
    console.error("Failed to logout:", error);
    throw error;
  }
};

export const createPost = async (text: string) => {
  try {
    const repo = agent.session?.did; // Ensure the agent is authenticated
    if (!repo) {
      throw new Error("Agent is not authenticated. Please create a session first.");
    }

    const response = await agent.post({
      repo, // The DID of the authenticated user
      collection: "app.bsky.feed.post", // Post collection
      text
    });

    console.log("Post created successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
};

