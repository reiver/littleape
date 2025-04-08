// pages/api/auth/peertube.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const PEERTUBE_INSTANCE = 'https://tube.gayfr.online' // Change if using another instance
const PEERTUBE_USERNAME = process.env.NEXT_PUBLIC_PEERTUBE_USERNAME as string
const PEERTUBE_PASSWORD = process.env.NEXT_PUBLIC_PEERTUBE_PASSWORD as string

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // 1. Get client_id and client_secret
        const clientRes = await axios.get(`${PEERTUBE_INSTANCE}/api/v1/oauth-clients/local`)
        const { client_id, client_secret } = clientRes.data

        // 2. Request access token using username/password
        const tokenRes = await axios.post(
            `${PEERTUBE_INSTANCE}/api/v1/users/token`,
            new URLSearchParams({
                client_id,
                client_secret,
                grant_type: 'password',
                response_type: 'code',
                username: PEERTUBE_USERNAME,
                password: PEERTUBE_PASSWORD,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )

        console.log("Token Response is: ", tokenRes)

        // 3. Return token response
        return res.status(200).json(tokenRes.data)
    } catch (error: any) {
        console.error('OAuth error:', error.response?.data || error.message)
        return res.status(500).json({ error: 'Failed to authenticate with PeerTube' })
    }
}
