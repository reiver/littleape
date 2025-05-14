import { LOGJAM_URL } from "components/Navbar";
import { useRouter } from "next/router";
import { isFediverseMvpMode, isMvpMode } from "pages/auth/login";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Cookies from "js-cookie";
import { USER_COOKIE } from "constants/app";
import { useToast } from "@chakra-ui/react";
import logger from "lib/logger/logger";
import { GetServerSideProps } from "next";


function getHostUrl(hostname: String) {
    const baseUrl = LOGJAM_URL;
    return `${baseUrl}/${hostname}/host`
}

export default function HostPage({ appMeta }) {
    const [hashToSend, sethashToSend] = useState(null)
    const [iframeLoaded, setIframeLoaded] = useState(false);
    let _user = Cookies.get(USER_COOKIE);

    const router = useRouter();
    const { hostname } = router.query; // Extract query params

    const toast = useToast();

    useEffect(() => {
        if (!hostname) return; // wait until hostname is ready

        const user = _user ? JSON.parse(_user) : null;
        const prefix = "@";
        const hostNameWithoutPrefix = hostname?.startsWith(prefix)
            ? hostname.slice(prefix.length)
            : hostname;

        const shouldRedirect = (isMvpMode || isFediverseMvpMode) &&
            (!user || user.username !== hostNameWithoutPrefix);

        if (shouldRedirect) {
            toast({
                title: "403 Forbidden access",
                description: "Please Login to continue using GreatApe",
                status: "error",
                duration: 3000,
                isClosable: true,
            });

            router.replace("/auth/login");
        }
    }, [router, _user, hostname, isMvpMode, isFediverseMvpMode]);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    //send message to Iframe
    useEffect(() => {
        const sendMessageToIframe = () => {
            if (iframeRef.current) {
                logger.log("Sending message to iframe:", iframeRef.current?.contentWindow);

                iframeRef.current?.contentWindow?.postMessage(
                    { type: "FROMIFRAME", payload: "start" },
                    getHostUrl(hostname.toString()) // Use exact external origin, not "*"
                );
            }
        };

        if (iframeRef.current) {
            setTimeout(sendMessageToIframe, 1000); // Delay ensures iframe is ready
        }
    }, [iframeLoaded, hostname]);


    //handle message from Iframe
    useEffect(() => {
        const handlePostMessage = (event) => {
            if (event.data.type === "RELOAD_PARENT_WINDOW") {
                logger.log("Received reload request from iframe, reloading parent window...");
                window.location.reload();
            }
        };

        window.addEventListener("message", handlePostMessage);

        // Cleanup listener when the component unmounts or on re-render
        return () => {
            window.removeEventListener("message", handlePostMessage);
        };
    }, []);


    useEffect(() => {
        const hashData = window.location.hash.split("#start-meeting=")[1];

        if (hashData) {
            try {
                const receivedData = JSON.parse(decodeURIComponent(hashData));
                logger.log("received Data: ", receivedData);
                logger.log("Top WINDOW URL: ", window.location.origin)

                // Prepare the data to send
                const dataToSend = {
                    from: receivedData.from,
                    to: receivedData.to,
                    roomname: receivedData.roomname,
                    username: receivedData.username,
                    hostLink: receivedData.hostLink,
                    audienceLink: receivedData.audienceLink,
                    topWindowUrl: window.location.origin
                };

                // Serialize the data into a URL hash
                const newHash = encodeURIComponent(JSON.stringify(dataToSend));
                sethashToSend(newHash)

                window.location.hash = "";

            } catch (error) {
                logger.error("Error parsing hash data", error);
            }

            window.location.hash = "";
        }
    }, []); // Empty dependency array to run once on mount


    const generateIframeUrlForHost = () => {
        if (hashToSend == null) {
            return getHostUrl(hostname.toString())
        }

        return `${getHostUrl(hostname.toString())}#start-meeting=${hashToSend}`
    }

    if (hostname != undefined && hostname.toString() != undefined && hostname.toString() != "") {

        return (
            <>
                <Head>
                    <title>{appMeta.APP_NAME}</title>
                    <meta name="description" content={appMeta.APP_DESCRIPTION} />

                    {/* Open Graph */}
                    <meta property="og:url" content={appMeta.APP_URL} />
                    <meta property="og:type" content="website" />
                    <meta property="og:locale" content="en_US" />
                    <meta property="og:title" content={appMeta.APP_NAME} />
                    <meta property="og:description" content={appMeta.APP_DESCRIPTION} />
                    <meta property="og:image" content={appMeta.IMAGE_URL} />


                    {/* Twitter */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta property="twitter:domain" content={appMeta.DOMAIN} />
                    <meta property="twitter:url" content={appMeta.APP_URL} />
                    <meta name="twitter:title" content={appMeta.APP_NAME} />
                    <meta name="twitter:description" content={appMeta.APP_DESCRIPTION} />
                    <meta name="twitter:image" content={appMeta.IMAGE_URL} />
                </Head>

                <iframe
                    ref={iframeRef}
                    src={`${generateIframeUrlForHost()}`}
                    onLoad={() => {
                        setIframeLoaded(true)
                    }}
                    width="100%"
                    height="100%"
                    title="Logjam Video Iframe"
                    style={{
                        border: "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100dvh",
                        minHeight: "100vh",
                        margin: 0,
                        padding: 0,
                        zIndex: 9999,
                        overflow: "hidden"
                    }}
                    id="logjamVideoIframe"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                    allow="camera; microphone; display-capture"
                ></iframe>
            </>
        );
    }

    return (
        <div>

        </div>
    );
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const handle = context.params?.hostname as string;

    const APP_NAME = `${handle} — ${process.env.NEXT_PUBLIC_CLIENT_NAME}`;
    const APP_DESCRIPTION = process.env.NEXT_PUBLIC_CLIENT_DESCRIPTION || '';
    const DOMAIN = process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN || '';
    const BASE_URL = process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL || '';
    const APP_URL = `${BASE_URL}/@${handle}/host`;
    const IMAGE_URL = `${BASE_URL}/meta-image.png` || '';

    logger.log("hanlde is: ", handle, " .. appname: ", APP_NAME)

    return {
        props: {
            appMeta: {
                APP_NAME,
                APP_DESCRIPTION,
                APP_URL,
                DOMAIN,
                IMAGE_URL,
            },
        },
    };
};