'use client';


import { Container } from "components/Container";
import logger from "lib/logger/logger";
import { useEffect, useState } from "react";
import Attendees, { AttendeesBottomSheet } from "../Attendees";
import { MoreOptions } from "../MoreOptions";
import { BottomBarBottomSheet } from "../BottomBar";
import { Video } from "./Stage";


export const MeetingBody = ({ customStyles }) => {

    useEffect(() => {
        if (customStyles) {

            // Create a style element and append it to the head of the document
            const styleElement = document.createElement('style');
            styleElement.id = 'customStyles';
            document.head.appendChild(styleElement);

            // Set the CSS content of the style element
            styleElement.textContent = customStyles;
            logger.log("Creating style elem Index.js")
        }
    }, [])

    const getLocalCameraStream = async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false, // set to true if you also want microphone
            });
            return stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            return null;
        }
    };

    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const loadStream = async () => {
            const localStream = await getLocalCameraStream();
            if (localStream) setStream(localStream);
        };

        loadStream();
    }, []);

    return (
        <>
            <Container className="relative h-full flex-grow overflow-hidden py-4 flex items-center" id="meeting-body">
                {/* <Stage customStyles={customStyles} /> */}
                {stream && <Video
                    stream={stream}
                // userId={attendee.userId}
                // isMuted={muted}
                // isUserMuted={attendee.muted}
                // name={attendee.name}
                // isHostStream={attendee.isHost}
                // isShareScreen={attendee.isShareScreen}
                // toggleScreen={attendee.toggleScreenId}
                // displayId={attendee.displayId}
                // customStyles={customStyles}
                />}
                <Attendees />
                <MoreOptions />
            </Container>
            <div className="sm:hidden">
                <BottomBarBottomSheet />
                <AttendeesBottomSheet />
            </div>
        </>
    )
}
