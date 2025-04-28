import apiClient from "./client";

// Types
interface PostToBlueskyRequest {
  did: string;
  text: string;
}

interface SubmitToBlueskyRequest {
  access_token: string;
  refresh_token: string;
  handle: string;
  did: string;
}

interface GetProfileResponse {
  did: string;
  handle: string;
  displayName: string;
}

// API Calls

export const postToBluesky = async (data: PostToBlueskyRequest) => {
  const response = await apiClient.post("/bluesky/post", data);
  return response.data;
};

export const submitToBluesky = async (data: SubmitToBlueskyRequest) => {
  const response = await apiClient.post("/bluesky/submit", data);
  return response.data;
};

export const getBlueskyProfile = async (did: string) => {
  const response = await apiClient.get<GetProfileResponse>(`/bluesky/profile`, {
    params: { did },
  });
  return response.data;
};
