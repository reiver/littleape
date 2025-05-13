import { ModalProps, useDisclosure } from "@chakra-ui/react";
import { QRCode, useSignIn } from '@farcaster/auth-kit';
import { FC, useState } from "react";
import FarcasterLogo from "../../public/Farcaster.svg";
import Close from '../../public/Close.svg'


import { createAppClient, viemConnector } from '@farcaster/auth-client';
import Icon from "components/Icon";
import { LinkCopyComponent } from "components/LinkCopyComponent";
import logger from "lib/logger/logger";

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
            siweUri: `${process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL}/auth/login`,
            domain: process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN
        });

        logger.log("Client data: ", data)
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
                // logger.log("Status: ", status.data);

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
                logger.error("Error checking status:", error);
                onError(error)
            }
        };

        checkStatus(channelToken);
    };


    const {
        signIn,
    } = useSignIn({
        onSuccess: (res) => {
            logger.log("useSignIn success", res)
            setError(null);  // Clear any existing error on success
            if (onSuccess) {
                onSuccess(res);
            }
        },
        onError: (err) => {
            logger.error('Sign-in error:', err);
            setError(err.message);
            if (onError) {
                onError(err);
            }
        }
    });

    return (
        <div>

            {
                <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => {
                    createChannel()
                }}>
                    <FarcasterLogo />
                </div>

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
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="z-10 absolute w-full h-full bg-black bg-opacity-60" />
            <div
                className="absolute -translate-y-full z-20 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[28%] sm:border border-gray-0"
            >
                <div className="flex justify-center items-center p-5 relative">
                    <span className="text-black text-bold-12">{"Login With Farcaster"}</span>
                    <Icon icon={Close} class="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer" onClick={onClose} />
                </div>
                <hr className="border-gray-0 sm:block hidden" />
                <div className="mx-4 my-4 flex flex-col items-center justify-center">
                    <div className="flex justify-center items-center">
                        <div className="relative w-[238px] max-h-[250px]">
                            <div className="absolute top-0 left-0 w-full h-full border border-gray-0 rounded-[13px] z-10 pointer-events-none" />
                            <QRCode uri={url} size={230} />
                        </div>
                    </div>
                    <span className="text-gray-2 text-bold-12 mt-4 text-center">
                        {"Scan the QR code with your phone or enter the link on your browser"}
                    </span>
                    <div className="mt-6">
                        <LinkCopyComponent link={url} />
                    </div>
                </div>

            </div>
        </div>
    )
}