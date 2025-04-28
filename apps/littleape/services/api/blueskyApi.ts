import { apiWrapper } from "./apiWarpper";
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


export const postToBluesky = (data: PostToBlueskyRequest) => {
    return apiWrapper(
        apiClient.post("/bluesky/post", data).then((res) => res.data)
    );
};

export const submitToBluesky = (data: SubmitToBlueskyRequest) => {
    return apiWrapper(
        apiClient.post("/bluesky/submit", data).then((res) => res.data)
    );
};

export const getBlueskyProfile = (did: string) => {
    return apiWrapper(
        apiClient.get<GetProfileResponse>("/bluesky/profile", {
            params: { did },
        }).then((res) => res.data)
    );
};
