import { ChakraProvider } from "@chakra-ui/react";
import theme from "chakra.config";
import { useAuthStore } from "store";
import "styles/tailwind.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SWRConfig } from "swr";
import { fetcher } from "services/http";
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
      }}
    >
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </SWRConfig>
  );
}

export default App;
