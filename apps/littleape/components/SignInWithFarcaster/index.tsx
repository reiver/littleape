import { Button, Modal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ModalProps, Text, useDisclosure } from "@chakra-ui/react";
import { QRCode, useSignIn } from '@farcaster/auth-kit';
import { FC, useState } from "react";
import CopyIcon from '../../public/Copy.svg';
import LinkIcon from '../../public/Link.svg';
import styles from "./MyComponent.module.css";


import { createAppClient, viemConnector } from '@farcaster/auth-client';

const appClient = createAppClient({
    ethereum: viemConnector(),
});

export const SignInWithFarcasterButton = ({ onSuccess, onError }) => {
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null)
    let shouldContinueChecking = true;

    const {
        isOpen: isShowQRCodeModalOpen,
        onOpen: onShowQRCodeModalOpen,
        onClose: onShowQRCodeModalClose,
    } = useDisclosure();

    const createChannel = async () => {
        const { data } = await appClient.createChannel({
            siweUri: "https://littleape-swart.vercel.app/auth/login",
            domain: "littleape-swart.vercel.app"
        });

        console.log("Client data: ", data)
        setUrl(data.url)

        // Open QR Code Modal when URL is set
        onShowQRCodeModalOpen();

        checkStatusContinuously(data.channelToken);

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
                    onShowQRCodeModalClose()
                    setUrl(null)
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


    const {
        signIn,
    } = useSignIn({
        onSuccess: (res) => {
            console.log("useSignIn success", res)
            setError(null);  // Clear any existing error on success
            if (onSuccess) {
                onSuccess(res);
            }
        },
        onError: (err) => {
            console.error('Sign-in error:', err);
            setError(err.message);
            if (onError) {
                onError(err);
            }
        }
    });

    return (
        <div>

            {
                !url && <Button className={styles.connectButtonLight} w="full" mt={error ? 0 : 3} onClick={() => {
                    createChannel()
                }}>
                    Continue With Farcaster
                </Button>
            }
            {url && (

                <div>
                    <ShowQRCodeModal
                        url={url}
                        isOpen={isShowQRCodeModalOpen}
                        onClose={() => {
                            onShowQRCodeModalClose()
                            setUrl(null)
                        }}
                    />
                </div>


            )}
        </div>

    )
}

function trimUrl(url, maxLength) {
    // Ensure maxLength is a positive number
    if (maxLength <= 0) {
        throw new Error("maxLength should be a positive number");
    }

    // Trim leading and trailing whitespace
    const trimmedUrl = url.trim();

    // Check if the URL length exceeds the maximum length
    if (trimmedUrl.length > maxLength) {
        // Trim the URL and add ellipsis
        return trimmedUrl.slice(0, maxLength - 3) + '...';
    }

    // Return the original URL if it doesn't exceed maxLength
    return trimmedUrl;
}


const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
};

type ShowQRCodeModalProps = { url: string } & Omit<ModalProps, "children">;

const ShowQRCodeModal: FC<ShowQRCodeModalProps> = ({ isOpen, onClose, url, ...props }) => {

    return (
        <Modal isOpen={isOpen} onClose={onClose} {...props}>
            <ModalOverlay />
            <ModalContent mx="3" _dark={{ bg: "dark.700" }} className={styles.modelContent}>
                <ModalHeader className={styles.centerDiv}
                    px={{
                        base: "4",
                        md: "6",
                    }}
                >
                    <Text className={styles.textHeading} fontSize={{ base: "md", md: "inherit" }}>Login With Farcaster</Text>
                </ModalHeader>
                <div className={styles.QRCode}>
                    <QRCode uri={url} size={250} />
                </div>
                <div className={styles.centerDiv}>
                    <Text className={styles.smallText}>Scan the QR code with your phone or enter the link on your browser</Text>
                </div>
                <ModalCloseButton />
                <ModalFooter>
                    <div className={styles.linkBackground}>
                        <LinkIcon />
                        <Text className={styles.linkText}>{trimUrl(url, 30)}</Text>
                        <Button
                            onClick={() => copyToClipboard(url)}
                            className={styles.iconButton}
                        >
                            <CopyIcon className={styles.icon} />
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}