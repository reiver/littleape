import { NextApiRequest, NextApiResponse } from "next";


async function getAccessToken(api: string, client_id: string, client_secret: string, username: string, password: string) {
    const response = await fetch(`${api}/users/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id,
            client_secret,
            grant_type: 'password',
            username,
            password, // automatically URL-encoded
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        return (`Error fetching access token: ${JSON.stringify(data)}`);
    }

    return data.access_token;
}


async function getUserAccount(api: string, username: string, access_token: string) {
    const response = await fetch(`${api}/accounts/${username}`, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        return `Error fetching user account: ${JSON.stringify(data)}`;
    }

    return data;
}


function isPeerTubeUser(obj: any): obj is {
    url: string;
    name: string;
    host: string;
    id: number;
    createdAt: string;
    displayName: string;
    updatedAt: string;
    userId: number;
} {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.url === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.host === 'string' &&
        typeof obj.id === 'number' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.displayName === 'string' &&
        typeof obj.updatedAt === 'string' &&
        typeof obj.userId === 'number'
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const instance = req.query.instance as string;

    if (!instance || !/^https?:\/\/[a-zA-Z0-9.-]+$/.test(instance)) {
        return res.status(400).json({ error: "Invalid or missing instance URL" });
    }

    try {

        // Register app dynamically
        const registerRes = await fetch(`${instance}/api/v1/oauth-clients/local`);

        if (!registerRes.ok) {
            res.redirect(`/auth/login?peertubeerror=${encodeURIComponent("App registration failed")}`);
        }

        const { client_id, client_secret } = await registerRes.json();

        const accessToken = await getAccessToken(`${instance}/api/v1`, client_id, client_secret, process.env.NEXT_PUBLIC_PEERTUBE_USERNAME, process.env.NEXT_PUBLIC_PEERTUBE_PASSWORD)

        if (accessToken.includes("error")) {
            res.redirect(`/auth/login?peertubeerror=${encodeURIComponent("Failed to get access token")}`);
        }

        const account = await getUserAccount(`${instance}/api/v1`, process.env.NEXT_PUBLIC_PEERTUBE_USERNAME, accessToken)

        if (isPeerTubeUser(account) === true) {
            res.redirect(`/auth/login?peertubeuser=${encodeURIComponent(JSON.stringify(account))}`);
        } else {
            res.redirect(`/auth/login?peertubeerror=${encodeURIComponent("Failed to get user account")}`);
        }

    } catch (err) {
        return res.status(500).json({ error: "Unexpected error", detail: (err as Error).message });
    }
}