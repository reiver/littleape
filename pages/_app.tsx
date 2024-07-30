import { ChakraProvider } from "@chakra-ui/react";
import { ThirdwebProvider, WalletProvider } from "web3-wallet-connection";

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
import "styles/global.css";
import { SWRConfig } from "swr";
import "../styles/styles.css";


dayjs.extend(relativeTime);

const queryClient = new QueryClient()
function App({ Component, pageProps }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  if (pageProps.user) setAuth(pageProps.token, pageProps.user);

  return (
    <WalletProvider>
      <ThirdwebProvider>
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
  );
}

export default App;
