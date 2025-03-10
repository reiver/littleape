// src/lib/api.ts
import { AppBskyRichtextFacet, AtpAgent, AtpSessionData } from "@atproto/api";

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
      console.log("New instance Value: ", BlueSkyApi.instance)
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


  setSession(bskySession: any) {
    this.agent.sessionManager.session = bskySession
  }

  // Function to authenticate and set up a session
  public async createSession(identifier: string, password: string) {
    try {
      const response = await this.agent.login({
        identifier,
        password,
      });

      this.session = { identifier, password }; // Store session information
      console.log("Session created successfully:");
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

  public async deleteSession(authToken: string) {
    const url = "https://bsky.social/xrpc/com.atproto.server.deleteSession";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${authToken}` // Add your auth token here
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return new Error(`Error: ${response.status} - ${errorData.error || "Unknown error"}`);
      }

      console.log("Session deleted successfully.");
      return response
    } catch (error) {
      console.error("Failed to delete session:", error);
      return error
    }
  }

  // Logout function
  public async logout() {
    try {

      const session = this.agent.sessionManager.session

      console.log("Session : ", session);
      const response = "No need to delete bsky session" //await this.deleteSession(session.refreshJwt)
      this.session = null; // Clear session
      BlueSkyApi.clearInstance()
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
      return profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  }

  // Create a post
  public async createPost(text: string) {
    try {

      const repo = this.agent.session?.did; // Ensure the agent is authenticated
    
      // Regex to detect URLs in the text
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);

      // console.log("URLs: ", urls)
      // If a URL is found in the text
      if (urls && urls.length > 0) {
        const url = urls[0]; // Take the first URL if there are multiple
        const facets: AppBskyRichtextFacet.Main[] = [
          {
            features: [
              {
                $type: 'app.bsky.richtext.facet#link',
                uri: url,
              },
            ],
            index: {
              byteStart: text.indexOf(url),
              byteEnd: text.indexOf(url) + url.length,
            },
          },
        ];

        const response = await this.agent.post({
          repo, // The DID of the authenticated user
          collection: "app.bsky.feed.post", // Post collection
          text,
          facets,
        });

        console.log("Post created successfully with Link URL");
        return response;
      }

      // If no URL is found, just post the text as is
      const response = await this.agent.post({
        repo, // The DID of the authenticated user
        collection: "app.bsky.feed.post", // Post collection
        text,
      });
      console.log("RESPONS from Craete post: ", response)

      console.log("Post created successfully without URL");
      return response;
    }
    catch (error) {
      console.error("Failed to create post:", error.status);
      return error;
    }
  }


  // Check if the session is expiring soon (within 10 minutes)
  private sessionIsExpiring(bskySession: any): boolean {
    if (!bskySession) return true; // No session means it's expiring
    const expiryDate = this.getSessionExpiryDate(bskySession);
    console.log("expiryDate is:", expiryDate)
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
    const decodedJWT = decodeJWT(session.accessJwt);
    if (decodedJWT != null) {
      return decodedJWT.exp * 1000; // Convert expiry date to milliseconds
    }

    return 950846413; //OLD time Fri Feb 18 2000 04:00:13 GMT+0000
  }

  // Resume the session manually if expired
  public async resumeSession(bskySession: any) {

    if (bskySession != null) {
      console.log("Old bsky session from PocketBase: ", bskySession)

      //get user session
      const expired = this.sessionIsExpiring(bskySession)
      console.log("Session is expired: ", expired)

      this.agent.sessionManager.session = bskySession

      if (expired) {
        const resumeSess = await this.agent.resumeSession(bskySession)
        console.log("Resumed Session: ", resumeSess)
      }
      return this.agent.session
    }
  }
}

