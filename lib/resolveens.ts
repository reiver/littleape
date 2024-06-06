import { Alchemy, Network } from "alchemy-sdk";

export function resolveENS(ens): Promise<string | null> {
  const config = {
    apiKey: "kTF2A9Po4AmIwjZ3jnWvhppvYn5pjnL9",
    network: Network.ETH_MAINNET,
  }
  const alchemy = new Alchemy(config);

  return alchemy.core.resolveName(ens);
}

export function lookUpENS(walletAddress):Promise<string | null>{

  const config = {
    apiKey: "kTF2A9Po4AmIwjZ3jnWvhppvYn5pjnL9",
    network: Network.ETH_MAINNET,
  }

  const alchemy = new Alchemy(config);

  return alchemy.core.lookupAddress(walletAddress);
}