import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { MightLikeCard } from "components/MightLikeCard";
import { NewPostCard } from "components/NewPostCard";
import { ProfileHeader } from "components/ProfileHeader";
import { TrendingTags } from "components/TrendingTags";
import { API_USER_PROFILE } from "constants/API";
import { DashboardLayout } from "layouts/Dashboard";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { fetch } from "services/http.server";
import { useAuthStore } from "store";
import useSWR from "swr";

export default function UserProfile() {
  const {
    query: { username },
  } = useRouter();
  const { data: activity } = useSWR(API_USER_PROFILE(String(username)));
  const loggedInUser = useAuthStore((state) => state.user);

  const user = activity && {
    avatar: activity.icon.url,
    banner: activity.image.url,
    display_name: activity.name,
    username: activity.preferredUsername,
    bio: activity.summary,
  };
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
          <ProfileHeader user={user} />
          {user && user.username == loggedInUser?.username && <NewPostCard />}
          {user && <Feed username={user.username} />}
        </Box>
        <Box
          gridColumn="span 6 / span 6"
          display={{ base: "none", lg: "block" }}
        >
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
  try {
    const user = await fetch(
      API_USER_PROFILE(ctx.params.username.toString()),
      ctx.req,
      {
        activityPub: true,
      }
    );
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
