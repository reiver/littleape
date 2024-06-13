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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
