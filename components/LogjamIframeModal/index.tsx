import { Modal, ModalCloseButton, ModalContent, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { FC, useState } from "react";

export const LogjamIframeModal = ({ url, onClose }: { url: string, onClose: (data: any) => void }) => {
    const [showModal, setShowModal] = useState(true);

    const closeLogjamIframeModal = (data?: any) => {
        setShowModal(false); // Close the modal
        onClose(data); // Pass data back to parent
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
    onClose: (response: any) => void;
} & Omit<ModalProps, "children">;

const ShowLogjamIframeModal: FC<ShowLogjamIframeModalProps> = ({ isOpen, onClose = () => { }, url, ...props }) => {
    console.log("Inside ShowLogjamIframeModal");

    const [iframeLoaded, setIframeLoaded] = useState(false);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        console.log("Iframe loaded successfully.");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} {...props} closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent
                mx="3"
                p="4"
                borderRadius="lg"
                _dark={{ bg: "gray.800" }}
                boxShadow="lg"
            >
                <ModalCloseButton />

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
