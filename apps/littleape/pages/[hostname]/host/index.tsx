import { LOGJAM_URL } from "components/Navbar";
import { useRouter } from "next/router";
import { isMvpMode } from "pages/auth/login";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "store";
import Head from "next/head";


function getHostUrl(hostname: String) {
    const baseUrl = LOGJAM_URL;
    return `${baseUrl}/${hostname}/host`
}

export default function HostPage() {
    const [hashToSend, sethashToSend] = useState(null)
    const [iframeLoaded, setIframeLoaded] = useState(false);
    let user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { hostname } = router.query; // Extract query params

    if (isMvpMode == true) {
        console.log("USER IN METTING IS: ", user)
        if (user == null) {
            useEffect(() => {
                router.replace("/auth/login");
            }, [router]);
        }
    }

    console.log("Hostname form QueryParams: ", hostname)

    const iframeRef = useRef<HTMLIFrameElement>(null);

    //send message to Iframe
    useEffect(() => {
        const sendMessageToIframe = () => {
            if (iframeRef.current) {
                console.log("Sending message to iframe:", iframeRef.current?.contentWindow);

                iframeRef.current?.contentWindow?.postMessage(
                    { type: "FROMIFRAME", payload: "start" },
                    getHostUrl(hostname.toString()) // Use exact external origin, not "*"
                );
            }
        };

        console.log("Iframe curret is: ", iframeRef)
        if (iframeRef.current) {
            setTimeout(sendMessageToIframe, 1000); // Delay ensures iframe is ready
        }
    }, [iframeLoaded, hostname]);


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


    useEffect(() => {
        const hashData = window.location.hash.split("#start-meeting=")[1];

        if (hashData) {
            try {
                const receivedData = JSON.parse(decodeURIComponent(hashData));
                console.log("received Data: ", receivedData);
                console.log("Top WINDOW URL: ", window.location.origin)

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
                console.error("Error parsing hash data", error);
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

        console.log(`YOYOYO: ${generateIframeUrlForHost()}`)

        return (
            <>
                <Head>
                    <title>GreatApe - Host</title>
                </Head>

                <iframe
                    ref={iframeRef}
                    src={`${generateIframeUrlForHost()}`}
                    onLoad={() => {
                        console.log("I FRAME IS LOADED...")
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
