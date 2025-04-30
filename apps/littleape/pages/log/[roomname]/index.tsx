import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { LOGJAM_URL } from "components/Navbar";
import Head from "next/head";

function getAudienceUrl(roomname: string) {

    // Get query param 'st' from URL
    const urlParams = new URLSearchParams(window.location.search);
    const startTime = urlParams.get('st');
    var meetingSt = 0
    if (startTime) {
        meetingSt = Number(startTime); // convert to number before setting
    }

    const baseUrl = LOGJAM_URL;
    return `${baseUrl}/log/${roomname}?st=${meetingSt}`;
}

export default function AudiencePage() {
    const router = useRouter();
    const { roomname } = router.query;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const sendMessageToIframe = () => {
            if (iframeRef.current) {
                console.log("Sending message to iframe:", iframeRef.current?.contentWindow);

                iframeRef.current?.contentWindow?.postMessage(
                    { type: "FROMIFRAME", payload: "parenturl" },
                    getAudienceUrl(roomname.toString()) // Use exact external origin, not "*"
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
    }, [roomname]);

    //handle message from Iframe
    useEffect(() => {
        const handlePostMessage = (event) => {
            if (event.data.type === "RELOAD_PARENT_WINDOW") {
                console.log("Received reload request from iframe, reloading parent window...");
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
                    <title>GreatApe - Audience</title>
                </Head>
                <iframe
                    ref={iframeRef}
                    src={`${getAudienceUrl(roomname.toString())}`}
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
