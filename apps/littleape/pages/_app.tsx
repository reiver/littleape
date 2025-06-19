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
import { muiTheme } from "theme";
import { ThemeProvider } from "@mui/material/styles";

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
    <ThemeProvider theme={muiTheme}>
      <AuthKitProvider config={config}>
        <WalletProvider>
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
        </WalletProvider>
      </AuthKitProvider>
    </ThemeProvider>

  );
}

export default App;
