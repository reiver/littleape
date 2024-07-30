import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { MightLikeCard } from "components/MightLikeCard";
import { NewPostCard } from "components/NewPostCard";
import { ProfileHeader } from "components/ProfileHeader";
import { TrendingTags } from "components/TrendingTags";
import { DashboardLayout } from "layouts/Dashboard";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { FETCH_USER_PROFILE } from "services/api";
import { useAuthStore } from "store";
import useSWR from "swr";
import { ActivityUser } from "types/User";

export default function UserProfile() {
  const {
    query: { username },
  } = useRouter();
  
  const { data: user } = useSWR<ActivityUser>(FETCH_USER_PROFILE(username));
  const loggedInUser = useAuthStore((state) => state.user);
  const title = `Greatape | @${String(username) || ""}`;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <DashboardLayout
        display="grid"
        gridTemplateColumns="repeat(24, minmax(0, 1fr))"
        gridGap={3}
        mt={1}
      >
        <Box
          gridColumn={{
            base: "span 24 / span 24",
            lg: "span 18 / span 18",
          }}
          display="flex"
          flexDirection="column"
          experimental_spaceY={3}
        >

          <ProfileHeader username={String(username)} />
          {user && username == loggedInUser?.username && <NewPostCard />}
          {user && <Feed username={String(username)} />}
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

export const getServerSideProps = withAuth("guest-authorized", async (ctx) => {
  const username = ctx.params.username.toString();
  let user = {
    api_key: "",
    avatar: "",
    banner: "",
    bio: "",
    name: "",
    email: "",
    github: "",
    id: 0,
    publicKey: "",
    username: "zaid",
  };
  //   try {
  //     user = await serverFetch(API_USER_PROFILE(username), ctx.req, {
  //       activityPub: true,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     return {
  //       notFound: true,
  //     };
  //   }

  return {
    props: {
      ...authProps(ctx),
      // swrFallback: {
      //   [unstable_serialize([
      //     API_USER_PROFILE(String(username)),
      //     { activity: true },
      //   ])]: user,
      // },
    },
  };
});
