import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { LOGJAM_URL } from "components/Navbar";
import Head from "next/head";
import logger from "lib/logger/logger";
import { GetServerSideProps } from "next";

export default function AudiencePage({ appMeta }) {
    const router = useRouter();
    const { roomname } = router.query;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [audienceUrl, setAudienceUrl] = useState("");

    useEffect(() => {
        if (!roomname) return;

        const path = router.asPath;
        const parts = path.split("/");
        const startTime = parts[parts.length - 1];

        let meetingSt = 0;
        if (startTime) {
            meetingSt = Number(startTime);
        }

        const url = `${LOGJAM_URL}/${roomname}/log/${meetingSt}`;
        setAudienceUrl(url)

    }, [roomname, router.asPath]);

    useEffect(() => {
        const sendMessageToIframe = () => {
            if (iframeRef.current) {
                logger.log("Sending message to iframe:", iframeRef.current?.contentWindow);

                iframeRef.current?.contentWindow?.postMessage(
                    { type: "FROMIFRAME", payload: "parenturl" },
                    audienceUrl // Use exact external origin, not "*"
                );
            }
        };

        if (iframeRef.current) {
            iframeRef.current.onload = () => {
                setTimeout(sendMessageToIframe, 1000); // Delay ensures iframe is ready
            };
        }

        return () => {
            if (iframeRef.current) iframeRef.current.onload = null;
        };
    }, [roomname, audienceUrl]);

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

    if (roomname && roomname.toString().trim() !== "") {
        return (
            <>
                <Head>
                    <title>{appMeta.APP_NAME}</title>
                    <meta name="description" content={appMeta.APP_DESCRIPTION} />

                    {/* Open Graph */}
                    <meta property="og:url" content={appMeta.APP_URL} />
                    <meta property="og:type" content="video.other" />
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
                    src={`${audienceUrl}`}
                    width="100%"
                    height="100%"
                    title="Logjam Video Iframe"
                    style={{
                        border: "none",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        margin: 0,
                        padding: 0,
                        zIndex: 9999,
                    }}
                    id="logjamVideoIframe"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                    allow="camera; microphone; display-capture"
                ></iframe>
            </>

        );
    }

    return <div></div>;
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const handle = context.params?.roomname as string;
    const id = context.params?.timestamp as string;

    const APP_NAME = `${handle} — ${process.env.NEXT_PUBLIC_CLIENT_NAME}`;
    const APP_DESCRIPTION = process.env.NEXT_PUBLIC_CLIENT_DESCRIPTION || '';
    const DOMAIN = process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN || '';
    const BASE_URL = process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL || '';
    const APP_URL = `${BASE_URL}/${handle}/log/${id}`;
    const IMAGE_URL = `${BASE_URL}/ogimage.png`|| '';

    logger.log("hanlde is: ", handle, " .. id is: ", id, " .. appname: ", APP_NAME)

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
