import { Button, Modal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ModalProps, Spinner, Text, useDisclosure, useToast } from "@chakra-ui/react";
import { FC, useState } from "react";
import BlueSkyIconWhite from "../../public/Bluesky-white.svg";
import BlueSkyIcon from "../../public/Bluesky.svg"
import AtIcon from "../../public/at-sign.svg";
import ServerIcon from "../../public/server.svg";
import LockIcon from "../../public/lock.svg";
import LinkIcon from "../../public/external-link.svg"
import { BlueSkyApi } from "lib/blueSkyApi";
import { Response } from "@atproto/api/dist/client/types/com/atproto/server/createSession";
import { PocketBaseManager, SignInData, SignUpData, SignUpData2 } from "lib/pocketBaseManager";
import { waitForDebugger } from "inspector";
import error from "next/error";
import styles from "./MyComponent.module.css";
import { responseCache } from "viem/_types/utils/promise/withCache";
import logger from "lib/logger/logger";

const pbManager = PocketBaseManager.getInstance()


export const BlueSkyLoginButton = ({ onClose, existingAccountId = "" }: { onClose: (user: any) => void, existingAccountId: string }) => {
    const [showModal, setShowModal] = useState(false);

    const showLoginBlueSkyModal = () => setShowModal(true);
    const closeLoginBlueSkyModal = (user?: any) => {
        setShowModal(false);

        if (user != null) {
            if (user != undefined && user.record == null) {
                onClose(user)
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
                    existingAccountId={existingAccountId}
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

type ShowBlueSkyModalProps = { url: string, onClose: (response: any) => void, existingAccountId: string } & Omit<ModalProps, "children">;

const ShowBlueSkyModal: FC<ShowBlueSkyModalProps> = ({ isOpen, onClose = () => { }, url, existingAccountId, ...props }) => {
    const toast = useToast();

    const [serviceProvider, setServiceProriver] = useState("Bsky.social")
    const [email, setEmail] = useState("")
    const [pass, setPass] = useState("")
    const [isLoading, setIsLoading] = useState(false);

    const createServiceUrl = async () => {
        if (serviceProvider && typeof serviceProvider === "string") {
            logger.log("Service Provider:", serviceProvider);

            // Check if it starts with "http://" or "https://"
            const isValidHttp = serviceProvider.startsWith("http://") || serviceProvider.startsWith("https://");

            // If valid, return as is; otherwise, prepend "https://"
            const url = isValidHttp ? serviceProvider : `https://${serviceProvider}`;

            logger.log("Formatted Service URL:", url);
            return url; // Return the formatted URL
        }

        // Return default
        return BlueSkyApi.blueSkyServiceUrl;
    };


    const handleLoginBlueSkyAccount = async () => {
        if (isLoading) {
            return
        }

        if (email == "" || pass == "") {
            toast({
                title: "Please input email/username and password",
                description: ``,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
            return
        }

        setIsLoading(true)

        const url = await createServiceUrl()

        try {

            //initalize blue sky instance
            const blueSkyApi = BlueSkyApi.getInstance(url)

            const sessionResponse = await blueSkyApi.createSession(email, pass);//createSession(email, pass);
            logger.log("Session Response:", sessionResponse);

            const sessionWithService = await blueSkyApi.getBlueSkySessionWithServiceUrl()
            logger.log("sessionWithService: ", sessionWithService)

            if (sessionResponse.success == true) {

                const profile = await blueSkyApi.fetchProfile(sessionResponse.data.did) //fetchProfile(sessionResponse.data.did)
                logger.log("Profile is: ", profile)

                const user = await getOrRegisterUserWithBlueSky(profile.data, sessionWithService, existingAccountId)
                logger.log("User after getOrRegisterUserWithBlueSky: ", user)

                const loggedInUser = await pbManager.signIn(new SignInData(`${user.email}`, "12345678"))
                onClose(loggedInUser);

            } else {
                if (sessionResponse.includes("Invalid")) {
                    BlueSkyApi.clearInstance()
                    onClose(sessionResponse)
                    return
                }
            }

        } catch (error) {
            logger.error("Login Error:", error);
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
                            border: "2px solid #000000",
                            borderRadius: "8px",
                            padding: "16px"
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
                        <input
                            type="text"
                            placeholder="Bsky.Social"
                            value={serviceProvider}
                            onChange={(e) => setServiceProriver(e.target.value)}
                            style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Username/Email Input */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            border: "2px solid #000000",
                            borderRadius: "8px",
                            padding: "16px",
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
                            border: "2px solid #000000",
                            borderRadius: "8px",
                            padding: "16px",
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

async function getOrRegisterUserWithBlueSky(profile: unknown, sessionWithService: any, existingAccountId: string) {

    if (existingAccountId != "") {
        logger.log("existing account id: ", existingAccountId)
        logger.log("Bsky Profile: ", profile)
        logger.log("sessionWithService: ", sessionWithService)

        //fetch existing user
        const existingUser = await pbManager.fetchUserById(existingAccountId)
        let user; // Declare the variable outside the if-else block

        if (existingUser.fid === 0) {
            // User doesn't have Farcaster linked, so save all Bluesky data
            const updatedData = JSON.stringify({
                username: profile.handle,
                blueskyid: profile.did,
                name: profile.displayName,
                bio: profile.description,
            });
            user = await pbManager.updateUserProfileAndLinkBlueSky(existingAccountId, updatedData);
        } else {
            // User has Farcaster linked, save only required data
            const updatedData = JSON.stringify({
                blueskyid: profile.did,
            });
            user = await pbManager.updateUserProfileAndLinkBlueSky(existingAccountId, updatedData);
        }

        if (user != undefined) {
            // Parse the JSON string back into an object
            const sessObj = JSON.parse(sessionWithService);

            // Add a new element to the object
            sessObj.userid = user.id;

            // Convert the updated object back to a JSON string if needed
            const updatedSess = JSON.stringify(sessObj);

            //save user bsky session data
            const sessionSaved = await pbManager.saveBlueSkySessionInfo(updatedSess)
            logger.log("New Session info Saved: ", sessionSaved)
        }

        return user
    }

    if (profile != null && profile != undefined) {

        //register new user
        const username = profile.handle;
        const did = profile.did;
        const displayName = profile.displayName;
        const bio = profile.description;

        logger.log("user did: ", did)

        var user = await pbManager.getUserByBlueSkyId(did)
        logger.log("User in PB: ", user)

        var savedSessionInfo = await pbManager.fetchBlueSkySessionByUserId(user.id)
        logger.log("Saved Blue Sky Session in DB: ", savedSessionInfo)

        if (user.code == 404) {
            //user not found

            var signUpData = new SignUpData2({
                username: String(username),
                email: String(`${username}@littleape.com`),
                password: String("12345678"),
                blueskyid: did,
                name: String(displayName),
                bio: String(bio),
            });

            user = await pbManager.signUp2(signUpData);

            logger.log("new user by BSKY: ", user)

            // Parse the JSON string back into an object
            const sessObj = JSON.parse(sessionWithService);

            // Add a new element to the object
            sessObj.userid = user.id;

            // Convert the updated object back to a JSON string if needed
            const updatedSess = JSON.stringify(sessObj);

            //save user bsky session data
            const sessionSaved = await pbManager.saveBlueSkySessionInfo(updatedSess)
            logger.log("New Session info Saved: ", sessionSaved)

            return user;

        }

        // Parse the JSON string back into an object
        const sessObj = JSON.parse(sessionWithService);

        // Add a new element to the object
        sessObj.userid = user.id;

        // Convert the updated object back to a JSON string if needed
        const updatedSess = JSON.stringify(sessObj);

        //update session info
        const updatedSessionInfo = await pbManager.updateBlueSkySession(savedSessionInfo.id, updatedSess);
        logger.log("Session info Updated: ", updatedSessionInfo)

        return user;
    }

}
