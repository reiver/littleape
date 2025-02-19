import { Modal, ModalCloseButton, ModalContent, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { FC, useState } from "react";

export const LogjamIframeModal = ({ url, onClose }: { url: string, onClose: (userClickedCloseIcon: boolean) => void }) => {
    const [showModal, setShowModal] = useState(true);

    const closeLogjamIframeModal = (userClickedCloseIcon?: boolean) => {

        //close the model, if clicks close icon explisitly.. Don't need to start the meeting
        if (userClickedCloseIcon) {
            setShowModal(false);
            onClose(userClickedCloseIcon);
        } else {
            //send request to logjam and fetch data, before closing.. and start the meeting
            requestDataFromIframe()
        }

    };

    const requestDataFromIframe = () => {
        const iframe = document.getElementById("logjamIframe") as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: "REQUEST_DATA" }, "*");
        }
    };

    return (
        <ShowLogjamIframeModal
            isOpen={showModal}
            onClose={closeLogjamIframeModal}
            url={url} // Replace with your actual URL
        />
    );
};

type ShowLogjamIframeModalProps = {
    url: string;
    onClose: (userClickedCloseIcon: boolean) => void;
} & Omit<ModalProps, "children">;

const ShowLogjamIframeModal: FC<ShowLogjamIframeModalProps> = ({ isOpen, onClose = () => { }, url, ...props }) => {
    console.log("Inside ShowLogjamIframeModal");

    const [iframeLoaded, setIframeLoaded] = useState(false);


    const sendParentUrlToIframe = () => {
        const iframe = document.getElementById("logjamIframe") as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            console.log("Sending PARENT_URL to Iframe")
            iframe.contentWindow.postMessage({ type: "PARENT_URL" }, "*");
        }
    };

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        console.log("Iframe loaded successfully.");
        setTimeout(() => {
            sendParentUrlToIframe();
        }, 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={() => {
            onClose(false)
        }} {...props} closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent
                mx="3"
                p="4"
                borderRadius="lg"
                _dark={{ bg: "gray.800" }}
                boxShadow="lg"
            >
                <ModalCloseButton onClick={() => {
                    onClose(true)
                }} />

                <iframe
                    src={url}
                    width="100%"
                    height="600px"
                    title="Logjam Iframe"
                    style={{ border: "none" }}
                    onLoad={handleIframeLoad}
                    id="logjamIframe"
                ></iframe>
            </ModalContent>
        </Modal>
    );
};
