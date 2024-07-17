import { useContext, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useWallet } from "./walletContext";
import { useAddress, useSDK } from "@thirdweb-dev/react";

const useWalletActions = () => {
  const {
    walletConnected,
    messageSigned,
    setMessageSigned,
    setMessage,
    setSignature,
    setWalletIsSigned,
    setOnSignMessage,
  } = useWallet();

  const sdk = useSDK();
  let address = useAddress();

  const createMessage = async () => {
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + 30 * 60000);
    const notBefore = new Date(currentDate.getTime() + 10 * 60000);
    const randomUUID = uuidv4();

    const loginOptions = {
      Version: "1",
      ChainId: "1",
      Nonce: randomUUID,
      "Issued At": currentDate.toISOString(),
      "Expiration Time": expirationDate.toISOString(),
      "Not Before": notBefore.toISOString(),
    };

    const objectToString = (obj) => {
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    };

    const messageText = `${window.location.host} wants you to sign in with your Ethereum account:\n${address}\n\nPlease ensure that the domain above matches the URL of the current website.\n\n${objectToString(
      loginOptions
    )}`;

    return messageText;
  };

  const signMessage = async (message) => {
    console.log("MESSAGE:", message);

    try {
      const sig = await sdk?.wallet?.sign(message); // Assume sdk is globally available or imported

      if (!sig) {
        throw new Error("Failed to sign message");
      }

      setMessageSigned(true);
      setMessage(message);
      setSignature(sig);
      setWalletIsSigned(true);
    } catch (error) {
      console.log("Error while signing: ", error);
      setMessageSigned(false);
      setOnSignMessage(false);
    }
  };

  const createMessageAndSign = useCallback(
    async () => {
      console.log("Address: ", address);
      console.log("walletConnected: ", walletConnected);
      console.log("messageSigned: ", messageSigned);

      if (address !== undefined && walletConnected && !messageSigned) {
        console.log("Address is: ", address);
        console.log("SDK is: ", sdk.wallet);

        const message = await createMessage();

        //sign message
        await signMessage(`\x19Ethereum Signed Message:\n${message.length}${message}`);
      }
    },
    [walletConnected, messageSigned]
  );

  return { createMessageAndSign };
};

export default useWalletActions;
