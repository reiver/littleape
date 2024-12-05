// src/lib/api.ts
import { AtpAgent, AtpSessionData } from "@atproto/api";

export class BlueSkyApi {
  private agent: AtpAgent;
  private session: { identifier: string; password: string } | null;
  private static instance: BlueSkyApi | null = null; // Static instance property
  public static blueSkyServiceUrl = "https://bsky.social"
  private currentServiceUrl = "";


  // Static method to get the singleton instance
  public static getInstance(serviceUrl: string = ""): BlueSkyApi {
    if (!BlueSkyApi.instance) {
      if (serviceUrl == "") {
        console.log("Need service url to create new Bluesky Instance")
        return
      }
      console.log("Creating new Bluesky Instance")
      BlueSkyApi.instance = new BlueSkyApi(serviceUrl);
    } else {
      console.log("Returning Old Bluesky Instance")
    }
    return BlueSkyApi.instance;
  }

  public static clearInstance() {
    console.log("Clearing Bluesky Instance");
    BlueSkyApi.instance = null
  }

  private constructor(serviceUrl: string) {
    this.agent = new AtpAgent({
      service: serviceUrl,
    });
    this.session = null;
    this.currentServiceUrl = serviceUrl;
  }

  public getCurrentServiceUrl() {
    return this.currentServiceUrl;
  }

  // Function to authenticate and set up a session
  public async createSession(identifier: string, password: string) {
    try {
      const response = await this.agent.login({
        identifier,
        password,
      });

      this.session = { identifier, password }; // Store session information
      console.log("Session created successfully:", response.data);
      return response;
    } catch (error) {
      console.error("Failed to create session:", error);
      return "Invalid credentials OR service URL";
    }
  }

  //get session from agent
  public async getBlueSkySessionWithServiceUrl() {
    const sess = JSON.stringify({
      ...this.agent.session,
      service: this.agent.serviceUrl.toString(),
    })

    return sess
  }

  // Logout function
  public async logout() {
    try {
      const response = await this.agent.logout();
      this.session = null; // Clear session
      console.log("Logout successfully:", response);
      return response;
    } catch (error) {
      console.error("Failed to logout:", error);
      throw error;
    }
  }

  // Fetch profile for a given identifier
  public async fetchProfile(identifier: string) {
    try {
      const profile = await this.agent.getProfile({ actor: identifier });
      console.log("Profile: ", profile);
      return profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  }

  // Create a post
  public async createPost(text: string) {
    try {
      if (!this.agent.session) {
        throw new Error("Agent is not authenticated. Please create a session first.");
      }

      const repo = this.agent.session?.did; // Ensure the agent is authenticated
      if (!repo) {
        throw new Error("No DID found. Ensure session is created.");
      }

      const response = await this.agent.post({
        repo, // The DID of the authenticated user
        collection: "app.bsky.feed.post", // Post collection
        text,
      });

      console.log("Post created successfully:", response);
      return response;
    } catch (error) {
      console.error("Failed to create post:", error);
      throw error;
    }
  }

  // Check if the session is expiring soon (within 10 minutes)
  private sessionIsExpiring(): boolean {
    if (!this.agent.session) return true; // No session means it's expiring
    const expiryDate = this.getSessionExpiryDate(this.agent.session);
    return Date.now() > expiryDate - 10 * 60 * 1000; // Check if session is expiring in less than 10 minutes
  }

  // Get the expiry date of the session
  private getSessionExpiryDate(session: AtpSessionData): number {
    const decodeJWT = (token: string) => {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        console.error('Failed to parse JWT token:', e);
        return null;
      }
    };
    return decodeJWT(session.accessJwt).exp * 1000; // Convert expiry date to milliseconds
  }

  // Resume the session manually if expired
  public async resumeSession(bskySession: any) {

    if (bskySession != null) {
      // Try to resume the session if expired
      const response = await this.agent.resumeSession(bskySession);
      if (!response.success) throw new Error('Failed to resume session');

      return this.agent.session
    }

  }
}

