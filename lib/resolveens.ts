import { Alchemy, Network } from "alchemy-sdk";
const alchemyApiKey = process.env.ALCHEMY_API_KEY;
export function resolveENS(ens): Promise<string | null> {
  const config = {
    apiKey: alchemyApiKey,
    network: Network.ETH_MAINNET,
  }
  const alchemy = new Alchemy(config);

  return alchemy.core.resolveName(ens);
}

export function lookUpENS(walletAddress):Promise<string | null>{

  const config = {
    apiKey: alchemyApiKey,
    network: Network.ETH_MAINNET,
  }

  const alchemy = new Alchemy(config);

  return alchemy.core.lookupAddress(walletAddress);
}