// src/lib/api.ts
import { AtpAgent, AtpSessionData } from "@atproto/api";

export class BlueSkyApi {
  private agent: AtpAgent;
  private session: { identifier: string; password: string } | null;
  private static instance: BlueSkyApi | null = null; // Static instance property
  public static blueSkyServiceUrl = "https://bsky.social"


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
      if (!this.session) {
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

  // Get the session from local storage and resume if needed
  public async getSession(forceRefresh = false) {
    if (!forceRefresh && !this.sessionIsExpiring()) {
      return this.agent.session; // Session is valid, no need to resume
    }

    const savedSession = this.getSessionFromLocalStorage();
    if (!savedSession || (savedSession && !savedSession.service)) throw new Error('No saved session available');

    // Try to resume the session if expired
    const response = await this.agent.resumeSession(savedSession);
    if (!response.success) throw new Error('Failed to resume session');

    console.log('Session resumed. Expiry:', new Date(this.getSessionExpiryDate(this.agent.session)).toLocaleString('en-US'));

    // Save the refreshed session
    this.saveSessionToLocalStorage();
    return this.agent.session;
  }

  // Save the session to local storage
  private saveSessionToLocalStorage() {
    if (!this.agent.session) return;
    localStorage.setItem(
      'atpSession',
      JSON.stringify({
        ...this.agent.session,
        service: this.agent.serviceUrl.toString(),
      }),
    );
    console.log('Session saved to local storage.');
  }

  // Retrieve session from local storage
  private getSessionFromLocalStorage() {
    return typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('atpSession') || 'null') : null;
  }

  // Resume the session manually if expired
  public async resumeSession() {
    try {
      const session = await this.getSession(true); // Force refresh
      return session;
    } catch (error) {
      console.error("Failed to resume session:", error);
      throw error;
    }
  }
}

