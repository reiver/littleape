import React, { createContext, useContext, useState } from "react";

const WalletContext = createContext(null);

export const useWallet = () => {
  return useContext(WalletContext);
};

export const WalletProvider = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [onSignMessage, setOnSignMessage] = useState(false);

  return (
    <WalletContext.Provider
      value={{ walletConnected, setWalletConnected, onSignMessage, setOnSignMessage }}
    >
      {children}
    </WalletContext.Provider>
  );
};
