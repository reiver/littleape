import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react";
import { addWalletWithEnsData } from "components/ProfileHeader";
import { PocketBaseManager } from "lib/pocketBaseManager";
import { FC, useEffect } from "react";
import { User } from "types/User";
import { ConnectWallet, useAddress, useWallet } from "web3-wallet-connection";
import styles from "./MyComponent.module.css";

const pbManager = PocketBaseManager.getInstance()


interface SignWalletModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSignMessage: (value: Boolean) => void;
    forceSign: boolean;
}


export const SignWalletModal: FC<SignWalletModalProps> = ({ user, isOpen, onClose, onSignMessage, forceSign, ...props }) => {
    const address = useAddress();

    const {
        ensList,
        publicEnsList,
        setPublicEnsList,
        privateEnsList,
        setPrivateEnsList,
        isDisplayEnsNames,
        setIsDisplayEnsNames,
        ensVisibiltyUpdated,
        setEnsVisibiltyUpdated,
        walletVerified,
        setWalletVerified,
        currentlyConnectedWallet,
        walletsMap,
        setWalletsMap
    } = useWallet();

    useEffect(() => {
        if (forceSign) {
            setWalletVerified(false);
        }
    }, [forceSign, setWalletVerified]);

    const handleDisplayEnsToggle = (event) => {
        setIsDisplayEnsNames(event.target.checked)
        //empty the public ens list

        if (!event.target.checked) {
            publicEnsList.map((selectedEns) => {
                // Add to private list if it's not already there
                if (!privateEnsList.includes(selectedEns)) {
                    setPrivateEnsList([...privateEnsList, selectedEns]);
                }
            })

            setPublicEnsList([])
        }

    }


    useEffect(() => {
        if (currentlyConnectedWallet && publicEnsList) {
            addWalletWithEnsData(currentlyConnectedWallet, publicEnsList, setWalletsMap);
        }
    }, [publicEnsList])

    const handleCheckboxChange = (event, selectedEns) => {
        if (event.target.checked) {
            // Add ens to public list if it's not already there
            if (!publicEnsList.includes(selectedEns)) {
                setPublicEnsList([...publicEnsList, selectedEns]);
            }

            // Remove from private list
            setPrivateEnsList(privateEnsList.filter(ens => ens !== selectedEns));

        } else {
            // Remove ens from public list
            setPublicEnsList(publicEnsList.filter(ens => ens !== selectedEns));

            // Add to private list if it's not already there
            if (!privateEnsList.includes(selectedEns)) {
                setPrivateEnsList([...privateEnsList, selectedEns]);
            }
        }
    };

    useEffect(() => {
        if (publicEnsList.length > 0) {
            setIsDisplayEnsNames(true)
        } else {
            setIsDisplayEnsNames(false)
        }
    }, [publicEnsList])

    const closeSignInModel = async () => {
        onClose();
        setIsDisplayEnsNames(false);

        //check if public ens list is not empty... The update their public visibility in DB
        if (publicEnsList.length > 0) {
            setIsDisplayEnsNames(true)
            for (const ens of publicEnsList) {
                const visibilityUpdated = await pbManager.updateEnsVisibility(ens, true);
            }
        }

        if (privateEnsList.length > 0) {
            for (const ens of privateEnsList) {
                const visibilityUpdated = await pbManager.updateEnsVisibility(ens, false);
            }
        }

        setEnsVisibiltyUpdated(true);

    }

    return (
        <Modal isOpen={isOpen} onClose={closeSignInModel} {...props}>
            <ModalOverlay />
            <ModalContent mx="3" _dark={{ bg: "dark.700" }}>
                <Box>
                    <ModalHeader
                        px={{
                            base: "4",
                            md: "6",
                        }}
                    >
                        <Text fontSize={{ base: "md", md: "inherit" }}>Wallet Address Verification</Text>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody
                        pb={6}
                        px={{
                            base: "4",
                            md: "6",
                        }}
                    >
                        <Box display="flex" flexDirection="column" experimental_spaceY={4} className={styles.walletVerifyBox}>
                            <ConnectWallet theme="light" className={styles.connectButtonLight} />
                            <Text className={styles.walletVerifyBoxText}>
                                {`Address is:\n${address}`}
                            </Text>
                        </Box>

                        {isDisplayEnsNames &&
                            <Box display="flex" flexDirection="column" className={styles.boxMargin}>
                                <Text className={styles.walletVerifyBoxText}>ENS Names:</Text>
                                {
                                    ensList.map((element, index) => (
                                        <Box display="flex" className={styles.boxEnsList} alignItems="center" justifyContent="space-between">
                                            <Text key={element} className={styles.walletVerifyBoxText}>{element}</Text>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    className={styles.customCheckbox}
                                                    onChange={(event) => {
                                                        handleCheckboxChange(event, element)
                                                    }}
                                                    checked={publicEnsList.includes(element)}
                                                />
                                            </label>
                                        </Box>
                                    ))
                                }

                            </Box>
                        }


                        {
                            ensList.length > 0 && <Box display="flex" className={styles.boxMargin} alignItems="center" justifyContent="space-between">
                                <Text className={styles.walletVerifyBoxText}>Display the ENS name</Text>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        onChange={handleDisplayEnsToggle}
                                        checked={isDisplayEnsNames}
                                    />
                                    <span className={`${styles.slider} ${styles.round}`}></span>
                                </label>
                            </Box>
                        }

                    </ModalBody>
                    <ModalFooter>
                        {
                            !walletVerified && (
                                <Button
                                    size={{
                                        base: "sm",
                                        md: "md",
                                    }}
                                    mr={{
                                        md: "20px",
                                    }}
                                    colorScheme="primary"
                                    onClick={() => {
                                        onSignMessage(true)
                                        closeSignInModel();
                                    }}>Sign</Button>
                            )
                        }
                        {
                            walletVerified ? (<Button
                                onClick={closeSignInModel}>Close</Button>) : (<Button onClick={closeSignInModel}>Not now</Button>)
                        }

                    </ModalFooter>
                </Box>
            </ModalContent>
        </Modal>
    );
};
