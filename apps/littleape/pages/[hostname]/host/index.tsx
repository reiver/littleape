import { useEffect, useState } from "react";

export default function HostPage() {
    const [logjamLink, setLogjamLink] = useState("")
    const [hashToSend, sethashToSend] = useState(null)

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

                setLogjamLink(receivedData.hostLink)

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

    return (

        <iframe
            src={`${logjamLink}?host=localhost:8080#start-meeting=${hashToSend}`}
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
            allow="camera; microphone"
        ></iframe>
    );
}
