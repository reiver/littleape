import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { Footer } from "components/Footer";
import { MainMenu } from "components/MainMenu";
import { MightLikeCard } from "components/MightLikeCard";
import { NewPostCard } from "components/NewPostCard";
import { ProfileCard } from "components/ProfileCard";
import { TrendingTags } from "components/TrendingTags";
import { DashboardLayout } from "layouts/Dashboard";
import { PocketBaseManager } from "lib/pocketBaseManager";
import Head from "next/head";
import { useAuthStore } from "store";
import { useAddress } from "web3-wallet-connection";

const pbManager = PocketBaseManager.getInstance()

export default function Home() {
  let user = useAuthStore((state) => state.user);
  const address = useAddress()
  return (
    <>
      <Head>
        <title>Greatape</title>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </Head>
      <DashboardLayout
        footer={false}
        display="grid"
        gridTemplateColumns="repeat(24, minmax(0, 1fr))"
        gridGap={3}
        mt={1}
      >
        <Box gridColumn="span 5 / span 5" display={{ base: "none", lg: "block" }}>
          <Box
            position="sticky"
            top="75px"
            display="flex"
            justifyContent="space-between"
            flexDirection="column"
            h={{
              lg: "calc(100vh - 86px)",
            }}
          >
            <Box>
              <ProfileCard />
              <MainMenu mt={3} />
            </Box>
            <Footer compact />
          </Box>
        </Box>
        <Box
          gridColumn={{
            base: "span 24 / span 24",
            lg: "span 13 / span 13",
          }}
          display="flex"
          flexDirection="column"
          experimental_spaceY={3}
        >
          <NewPostCard />
          <Feed username={user?.username || ''} />
        </Box>
        <Box gridColumn="span 6 / span 6" display={{ base: "none", lg: "block" }}>
          <Box
            position="sticky"
            top="75px"
            display="flex"
            justifyContent="space-between"
            flexDirection="column"
            h={{
              lg: "calc(100vh - 86px)",
            }}
          >
            <Box display="flex" experimental_spaceY={3} flexDirection="column">
              <MightLikeCard />
              <TrendingTags />
            </Box>
          </Box>
        </Box>
      </DashboardLayout>
    </>
  );
}

// export const getServerSideProps = withAuth("authorized", (ctx) => {
//   return {
//     props: {
//       ...authProps(ctx),
//     },
//   };
// });
