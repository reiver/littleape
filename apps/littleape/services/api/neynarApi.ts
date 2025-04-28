import apiClient from "./client";

// Types
interface PostToNeynarRequest {
  fid: number; // uint64 in backend => number in TS
  text: string;
  parent_url?: string;
  embeds: any[];
}

interface SubmitToNeynarRequest {
  signer_uuid: string;
  fid: number;
}

// API Calls

export const postToNeynar = async (data: PostToNeynarRequest) => {
  const response = await apiClient.post("/neynar/cast", data);
  return response.data;
};

export const submitToNeynar = async (data: SubmitToNeynarRequest) => {
  const response = await apiClient.post("/neynar/submit", data);
  return response.data;
};
