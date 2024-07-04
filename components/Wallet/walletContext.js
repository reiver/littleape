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

  return (
    <WalletContext.Provider
      value={{
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
