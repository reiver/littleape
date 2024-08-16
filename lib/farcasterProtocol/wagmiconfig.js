import { createConfig, http } from "@wagmi/core";
import { sepolia } from "@wagmi/core/chains";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});
