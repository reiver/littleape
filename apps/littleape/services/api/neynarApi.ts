import { apiWrapper } from "./apiWarpper";
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


export const postToNeynar = (data: PostToNeynarRequest) => {
    return apiWrapper(
        apiClient.post("/neynar/cast", data).then((res) => res.data)
    );
};

export const submitToNeynar = (data: SubmitToNeynarRequest) => {
    return apiWrapper(
        apiClient.post("/neynar/submit", data).then((res) => res.data)
    );
};
