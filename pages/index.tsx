import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { Footer } from "components/Footer";
import { MainMenu } from "components/MainMenu";
import { NewPostCard } from "components/NewPostCard";
import { ProfileCard } from "components/ProfileCard";
import { DashboardLayout } from "layouts/Dashboard";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useAuthStore } from "store";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  return (
    <>
      <Head>
        <title>Greatape</title>
      </Head>
      <DashboardLayout
        footer={false}
        display="grid"
        gridTemplateColumns="repeat(24, minmax(0, 1fr))"
        gridGap={3}
        mt={1}
      >
        <Box
          gridColumn="span 5 / span 5"
          display={{ base: "none", lg: "block" }}
        >
          <Box
            position="sticky"
            top="70px"
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
            lg: "span 14 / span 14",
          }}
          display="flex"
          flexDirection="column"
          experimental_spaceY={3}
        >
          <NewPostCard />
          <Feed username={user.username} />
        </Box>
        <Box gridColumn="span 5 / span 5"></Box>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps = withAuth(true, (ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
