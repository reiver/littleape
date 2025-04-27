import { ChakraProvider } from "@chakra-ui/react";
import { ThirdwebProvider, WalletProvider } from "web3-wallet-connection";

import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import {
  QueryClient
} from '@tanstack/react-query';
import theme from "chakra.config";
import { API_PROFILE } from "constants/API";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "react-virtualized/styles.css";
import { fetcher } from "services/http";
import { useAuthStore } from "store";
import { SWRConfig } from "swr";
import "../styles/global.css";
import "../styles/styles.css";
import { NeynarContextProvider, Theme } from "@neynar/react";
import { ReactNode } from "react";

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'littleape-swart.vercel.app',
  siweUri: 'https://littleape-swart.vercel.app/auth/login',
  relay: 'https://relay.farcaster.xyz',
};

dayjs.extend(relativeTime);

const queryClient = new QueryClient()
function App({ Component, pageProps }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  if (pageProps.user) setAuth(pageProps.token, pageProps.user);

  return (

    <AuthKitProvider config={config}>
      <WalletProvider>
        <NeynarProviderWrapper>
          <ThirdwebProvider clientId={process.env.NEXT_PUBLIC_THIRD_WEB_CLIENT_ID}>
            <SWRConfig
              value={{
                provider: () => new Map(),
                fetcher,
                revalidateOnFocus: false,
                revalidateIfStale: false,
                fallback: {
                  [API_PROFILE]: pageProps.user,
                  ...pageProps.swrFallback,
                },
              }}
            >
              <ChakraProvider theme={theme}>
                <Component {...pageProps} />
              </ChakraProvider>
            </SWRConfig>
          </ThirdwebProvider>
        </NeynarProviderWrapper>
      </WalletProvider>
    </AuthKitProvider>
  );
}

export default App;


interface NeynarProviderWrapperProps {
  children: ReactNode;
}

export const NeynarProviderWrapper: React.FC<NeynarProviderWrapperProps> = ({ children }) => {
  const neynarSettings = {
    clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
    defaultTheme: Theme.Light,
    eventsCallbacks: {
      onAuthSuccess: ({ user }) => {
        console.log("Auth success: ", user);
      },
      onSignout: () => {
        console.log("Sign out success");
      },
    },
  };

  return <NeynarContextProvider settings={neynarSettings}>{children}</NeynarContextProvider>;
};