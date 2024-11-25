import { Button, Modal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ModalProps, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import { FC, useState } from "react";
import BlueSkyIconWhite from "../../public/Bluesky-white.svg";
import BlueSkyIcon from "../../public/Bluesky.svg"
import AtIcon from "../../public/at-sign.svg";
import ServerIcon from "../../public/server.svg";
import LockIcon from "../../public/lock.svg";
import LinkIcon from "../../public/external-link.svg"
import { createSession, fetchProfile } from "lib/blueSkyApi";
import { Response } from "@atproto/api/dist/client/types/com/atproto/server/createSession";
import { PocketBaseManager, SignInData, SignUpData, SignUpData2 } from "lib/pocketBaseManager";
import { waitForDebugger } from "inspector";
import error from "next/error";
import styles from "./MyComponent.module.css";
import { responseCache } from "viem/_types/utils/promise/withCache";

const pbManager = PocketBaseManager.getInstance()


export const BlueSkyLoginButton = ({ onClose }: { onClose: (user: any) => void }) => {
    const [showModal, setShowModal] = useState(false);

    const showLoginBlueSkyModal = () => setShowModal(true);
    const closeLoginBlueSkyModal = (user?: any) => {
        setShowModal(false);

        if (user != null) {
            if (user != undefined && user == "Invalid credentials") {
                onClose("Invalid credentials")
                return
            }

            onClose(user)
        }


    }

    return (
        <>
            {/* BlueSky Modal */}
            {showModal && (
                <ShowBlueSkyModal
                    isOpen={showModal}
                    onClose={closeLoginBlueSkyModal}
                    url="https://bsky.social/login" // Replace with your actual URL
                />
            )}

            {/* Button */}
            <div className="relative group">
                <Button className={styles.connectButtonLight} w="full" mt={error ? 0 : 3} onClick={showLoginBlueSkyModal}>
                    Continue With Bluesky
                </Button>
            </div>
        </>
    );
};

type ShowBlueSkyModalProps = { url: string, onClose: (response: any) => void } & Omit<ModalProps, "children">;

const ShowBlueSkyModal: FC<ShowBlueSkyModalProps> = ({ isOpen, onClose = () => { }, url, ...props }) => {

    const [email, setEmail] = useState("")
    const [pass, setPass] = useState("")
    const [isLoading, setIsLoading] = useState(false);


    const handleLoginBlueSkyAccount = async () => {
        if (isLoading) {
            return
        }

        try {
            const sessionResponse = await createSession(email, pass);
            console.log("Session Response:", sessionResponse);

            if (sessionResponse.success == true) {

                const profile = await fetchProfile(email)
                console.log("Profile is: ", profile)

                const user = await getOrRegisterUserWithBlueSky(profile.data)
                console.log("User after getOrRegisterUserWithBlueSky: ", user)

                const loggedInUser = await pbManager.signIn(new SignInData(`${user.username}@littleape.com`, "12345678"))
                onClose(loggedInUser);

            } else {
                if (sessionResponse.includes("Invalid credentials")) {
                    onClose("Invalid credentials")
                    return
                }
            }

        } catch (error) {
            console.error("Login Error:", error);
        }
    }

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
                {/* Header */}
                <ModalHeader textAlign="center" fontSize="lg" fontWeight="bold">
                    Login With Bluesky
                </ModalHeader>
                <ModalCloseButton />

                {/* Form */}
                <div style={{ padding: "16px 0" }}>
                    {/* Server Info Section */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "12px",
                            border: "1px solid #E0E0E0",
                            borderRadius: "6px",
                            padding: "12px",
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                marginRight: "8px",
                                background: "#F5F5F5",
                                borderRadius: "4px",
                            }}
                        >
                            <ServerIcon />
                        </span>
                        Bsky.social
                    </div>

                    {/* Username/Email Input */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #E0E0E0",
                            borderRadius: "6px",
                            padding: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                marginRight: "8px",
                                background: "#F5F5F5",
                                borderRadius: "4px",
                            }}
                        >
                            <AtIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Username or email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #E0E0E0",
                            borderRadius: "6px",
                            padding: "12px",
                            position: "relative",
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                marginRight: "8px",
                                background: "#F5F5F5",
                                borderRadius: "4px",
                            }}
                        >
                            <LockIcon />
                        </span>
                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="App password"
                            style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                            }}
                        />
                        <button
                            style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                            }}
                        >
                            <LinkIcon />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <ModalFooter flexDirection="column" textAlign="center" mt="4">
                    <Text mb="4">
                        Don’t have an account yet?{" "}
                        <a href="https://bsky.app/" style={{ color: "#3182CE", textDecoration: "underline" }}>
                            Register!
                        </a>
                    </Text>
                    <Button
                        width="100%"
                        bg="#3182CE"
                        color="white"
                        borderRadius="6px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap="8px" // Space between the icon and text
                        _hover={{ bg: "#2B6CB0" }}
                        onClick={() => {
                            handleLoginBlueSkyAccount()
                            setIsLoading(true)
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" color="white" /> {/* Show spinner while loading */}
                                Loading...
                            </>
                        ) : (
                            <>
                                <BlueSkyIconWhite /> {/* Icon */}
                                Login With Bluesky
                            </>
                        )}
                    </Button>

                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

async function getOrRegisterUserWithBlueSky(profile: unknown) {

    if (profile != null && profile != undefined) {

        //register new user
        const username = profile.handle;
        const did = profile.did;
        const displayName = profile.displayName;
        const bio = profile.description;

        console.log("user did: ", did)

        var user = await pbManager.getUserByBlueSkyId(did)
        console.log("User in PB: ", user)

        if (user.code == 404) {
            //user not found

            var signUpData = new SignUpData2({
                username: String(username),
                email: String(`${username}@littleape.com`),
                password: String("12345678"),
                blueskyid: did,
                name: String(displayName),
                bio: String(bio)
            });

            user = await pbManager.signUp2(signUpData);

            console.log("new user by BSKY: ", user)

        }

        return user;
    }

}
