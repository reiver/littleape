import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { NewPostCard } from "components/NewPostCard";
import { ProfileCard } from "components/ProfileCard";
import { DashboardLayout } from "layouts/Dashboard";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Greateape</title>
      </Head>
      <DashboardLayout
        display="grid"
        gridTemplateColumns="repeat(24, minmax(0, 1fr))"
        gridGap={3}
        mt={1}
      >
        <Box gridColumn="span 5 / span 5">
          <ProfileCard position="sticky" top="70px" />
        </Box>
        <Box
          gridColumn="span 14 / span 14"
          display="flex"
          flexDirection="column"
          experimental_spaceY={3}
        >
          <NewPostCard />
          <Feed />
        </Box>
        <Box gridColumn="span 5 / span 5"></Box>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps = withAuth((ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
