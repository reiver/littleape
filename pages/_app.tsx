import { ChakraProvider } from "@chakra-ui/react";
import theme from "chakra.config";
import { API_PROFILE } from "constants/API";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "react-virtualized/styles.css";
import { fetcher } from "services/http";
import { useAuthStore } from "store";
import "styles/tailwind.css";
import { SWRConfig } from "swr";

dayjs.extend(relativeTime);

function App({ Component, pageProps }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  if (pageProps.user) setAuth(pageProps.token, pageProps.user);

  return (
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
  );
}

export default App;
