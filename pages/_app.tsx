import { ChakraProvider } from "@chakra-ui/react";
import { ThirdwebProvider, WalletProvider } from "web3-wallet-connection";

import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { Sepolia } from "@thirdweb-dev/chains";
import theme from "chakra.config";
import { API_PROFILE } from "constants/API";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "react-virtualized/styles.css";
import { fetcher } from "services/http";
import { useAuthStore } from "store";
import "styles/global.css";
import { SWRConfig } from "swr";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from '../lib/farcasterProtocol/wagmiconfig';
import "../styles/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


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
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AuthKitProvider config={config}>
          <WalletProvider>
            <ThirdwebProvider
              activeChain={Sepolia}>
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
      </WagmiProvider>
    </QueryClientProvider>


  );
}

export default App;
