import { createContext, useContext, useState } from "react";

const WalletContext = createContext(null);

export const useWallet = () => {
  return useContext(WalletContext);
};

export const WalletProvider = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [onSignMessage, setOnSignMessage] = useState(false);
  const [showConnectedWallets, setShowConnectedWallets] = useState(false);
  const [currentlyConnectedWallet, setCurrentlyConnectedWallet] = useState(null);
  const [walletVerified, setWalletVerified] = useState(null);
  const [walletDataSaved, setWalletDataSaved] = useState(null);
  const [ensList, setEnsList] = useState([]);
  const [publicEnsList, setPublicEnsList] = useState([]);
  const [privateEnsList, setPrivateEnsList] = useState([]);
  const [isDisplayEnsNames, setIsDisplayEnsNames] = useState(false);
  const [ensVisibiltyUpdated, setEnsVisibiltyUpdated] = useState(false);
  const [verifiedWalletsList, setVerifiedWalletsList] = useState([]);
  const [messageSigned, setMessageSigned] = useState(false);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("N/A");
  const [walletIsSigned, setWalletIsSigned] = useState(false);
  const [walletsMap, setWalletsMap] = useState(new Map());

  const resetAll = () => {
    setWalletConnected(false);
    setOnSignMessage(false);
    setShowConnectedWallets(false);
    setCurrentlyConnectedWallet(null);
    setWalletVerified(null);
    setWalletDataSaved(null);
    setEnsList([]);
    setPublicEnsList([]);
    setPrivateEnsList([]);
    setIsDisplayEnsNames(false);
    setEnsVisibiltyUpdated(false);
    setVerifiedWalletsList([]);
    setMessageSigned(false);
    setMessage("");
    setSignature("N/A");
    setWalletIsSigned(false);
    setWalletsMap(new Map());
  };

  return (
    <WalletContext.Provider
      value={{
        walletIsSigned,
        setWalletIsSigned,
        message,
        setMessage,
        signature,
        setSignature,
        walletConnected,
        setWalletConnected,
        onSignMessage,
        setOnSignMessage,
        showConnectedWallets,
        setShowConnectedWallets,
        currentlyConnectedWallet,
        setCurrentlyConnectedWallet,
        walletVerified,
        setWalletVerified,
        walletDataSaved,
        setWalletDataSaved,
        ensList,
        setEnsList,
        publicEnsList,
        setPublicEnsList,
        isDisplayEnsNames,
        setIsDisplayEnsNames,
        ensVisibiltyUpdated,
        setEnsVisibiltyUpdated,
        verifiedWalletsList,
        setVerifiedWalletsList,
        privateEnsList,
        setPrivateEnsList,
        messageSigned,
        setMessageSigned,
        resetAll,
        walletsMap,
        setWalletsMap,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
