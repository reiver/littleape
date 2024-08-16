import { Box, Button, Text } from "@chakra-ui/react";
import { ID_GATEWAY_ADDRESS, idGatewayABI } from "@farcaster/hub-web";
import { MainLayout } from "layouts/Main";
import Head from "next/head"; // Correct import
import { ConnectWallet, useAddress } from "web3-wallet-connection";

import { createPublicClient, http } from "viem";

import { optimism, sepolia } from "viem/chains";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReadContract } from "wagmi";


const publicClient = createPublicClient({
    chain: optimism,
    transport: http("http://localhost:3000"),
});

const queryClient = new QueryClient();

const FarcasterAccount = () => {
    const { data: price } = useReadContract({
        address: ID_GATEWAY_ADDRESS,
        abi: idGatewayABI,
        functionName: "price",
        chainId: sepolia.id,
    });

    const address = useAddress();

    const getPrice = () => {
        console.log("Get Price: ", price);
    };

    return (
        <QueryClientProvider client={queryClient}>
            <MainLayout>
                <Head>
                    <title>GreatApe | Farcaster Account</title>
                </Head>
                <Box mx="auto" mt="10" w="full" maxW={"xl"}>
                    <Text>Hello, this is a page for testing Farcaster Account creation</Text>

                    <Box mt="10">
                        <ConnectWallet theme="light" />
                    </Box>

                    <Box className="flex" mt="4">
                        <Button onClick={getPrice} mr="4">
                            Get Price
                        </Button>
                        <div></div>
                    </Box>
                </Box>
            </MainLayout>
        </QueryClientProvider>
    );
};

export default FarcasterAccount;
