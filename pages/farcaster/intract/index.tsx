import {
    usePrivy,
    useLogout,
    useFarcasterSigner,
    FarcasterWithMetadata,
} from '@privy-io/react-auth'
import {
    ExternalEd25519Signer,
    HubRestAPIClient,
} from '@standard-crypto/farcaster-js'
import axios from 'axios'
import Head from 'next/head'
import { useEffect, useState } from 'react';

function FarcasterPage() {
    const [castInput, setCastInput] = useState('')

    const { user, getAccessToken, linkFarcaster } = usePrivy();
    const { ready, authenticated, login } = usePrivy();
    const {
        getFarcasterSignerPublicKey,
        signFarcasterMessage,
        requestFarcasterSignerFromWarpcast,
    } = useFarcasterSigner();

    const privySigner = new ExternalEd25519Signer(
        signFarcasterMessage,
        getFarcasterSignerPublicKey
    );
    const hubClient = new HubRestAPIClient({
        hubUrl: 'https://hub-api.neynar.com',
        axiosInstance: axios.create({
            headers: { api_key: 'NEYNAR_PRIVY_DEMO' },
        }),
    });

    const farcasterAccount = user?.linkedAccounts.find(
        (a) => a.type === 'farcaster'
    ) as FarcasterWithMetadata;
    const signerPublicKey = farcasterAccount?.signerPublicKey;

    console.log("Farcaster Account: ", farcasterAccount)

    // Define fetchAccessToken inside the component
    async function fetchAccessToken() {
        const accessToken = await getAccessToken();
        console.log("Token: ", accessToken);
    }

    useEffect(() => {
        fetchAccessToken();
    }, []); // Run once on mount

    const disableLogin = !ready || (ready && authenticated);

    const { logout } = useLogout({
        onSuccess: () => {
            console.log('🫥 ✅ logOut onSuccess')

        },
    })

    return (
        <>
            <Head>
                <title>Farcaster Interaction Demo</title>
            </Head>
            <main>
                <div className='flex flex-row gap-4'>
                    <button
                        onClick={logout}
                        className='rounded-md bg-violet-200 px-4 py-2 text-sm text-violet-700 hover:text-violet-900'
                    >
                        Logout
                    </button>
                </div>
                <div>
                    <button disabled={disableLogin} onClick={login}>
                        Log in
                    </button>
                </div>

                <button onClick={linkFarcaster}>Link your Farcaster</button>
                <div className='flex flex-wrap gap-4'>
                    {!signerPublicKey && (
                        <button
                            className='mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
                            onClick={requestFarcasterSignerFromWarpcast}
                            disabled={!!signerPublicKey}
                        >
                            Request Farcaster Signer from Warpcast
                        </button>
                    )}
                </div>

                <p className='mb-2 mt-6 text-sm font-bold uppercase text-gray-600'>
                    Submit a cast
                </p>
                <div className='flex flex-wrap gap-4'>
                    <input
                        placeholder='My cast text!'
                        className='w-full rounded-md'
                        type='text'
                        value={castInput}
                        onChange={(e) => setCastInput(e.target.value)}
                    ></input>
                    <button
                        className='rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700'
                        onClick={async () => {
                            const { hash } = await hubClient.submitCast(
                                {
                                    text: castInput,
                                },
                                farcasterAccount.fid!,
                                privySigner
                            )
                            setCastInput('')
                            // toast(`Submitted cast. Message hash: ${hash}`)
                            // setTimeout(() => trigger(), 2000)
                        }}
                        disabled={!castInput}
                    >
                        Submit
                    </button>
                </div>
            </main>
        </>
    );
}

export default FarcasterPage;
