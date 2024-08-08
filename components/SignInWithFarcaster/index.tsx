import { Button, Text } from "@chakra-ui/react";
import { QRCode, useSignIn } from '@farcaster/auth-kit';
import { useState } from "react";
import styles from "./MyComponent.module.css";

import { createAppClient, viemConnector } from '@farcaster/auth-client';

const appClient = createAppClient({
    ethereum: viemConnector(),
});

export const SignInWithFarcasterButton = ({ onSuccess, onError }) => {
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null)
    let shouldContinueChecking = true;

    const createChannel = async () => {
        const { data } = await appClient.createChannel({
            siweUri: "https://littleape-swart.vercel.app/auth/login",
            domain: "littleape-swart.vercel.app"
        });

        console.log("Client data: ", data)
        setUrl(data.url)

        checkStatusContinuously(data.channelToken);

    }

    if (url == null) {
        createChannel()
    }

    const checkStatusContinuously = (channelToken) => {
        const checkStatus = async (channelToken) => {
            if (!shouldContinueChecking) {
                return
            }

            try {
                const status = await appClient.status({ channelToken });
                // console.log("Status: ", status.data);

                if (status.data.state === "completed") {
                    onSuccess(status)
                    return;
                }

                // Continue checking after 1000ms
                setTimeout(() => {
                    checkStatus(channelToken);
                }, 1000);
            } catch (error) {
                console.error("Error checking status:", error);
                onError(error)
            }
        };

        checkStatus(channelToken);
    };

    return (
        <div>
            {url && (
                <div>
                    <Text className={styles.largeText}>Sign in with Farcaster</Text>
                    <Text className={styles.smallText}>Scan with your phone's camera to continue.</Text>
                    <QRCode uri={url} size={310} />
                </div>
            )}
        </div>

    )
}