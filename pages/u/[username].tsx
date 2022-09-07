import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { NewPostCard } from "components/NewPostCard";
import { ProfileHeader } from "components/ProfileHeader";
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

  return (
    <>
      <Head>
        <title>Greatape | {`@${username}`}</title>
      </Head>
      <DashboardLayout
        footer={false}
        display="grid"
        gridTemplateColumns="repeat(24, minmax(0, 1fr))"
        gridGap={3}
        mt={1}
      >
        <Box
          gridColumn={{
            base: "span 24 / span 24",
            lg: "span 19 / span 19",
          }}
          display="flex"
          flexDirection="column"
          experimental_spaceY={3}
        >
          <ProfileHeader user={user} />
          {user && user.username == loggedInUser.username && <NewPostCard />}
          {user && <Feed username={user.username} />}
        </Box>
        <Box gridColumn="span 5 / span 5"></Box>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps = withAuth(true, async (ctx) => {
  try {
    const user = await fetch(
      API_USER_PROFILE(ctx.params.username.toString()),
      ctx.req
    );
  } catch (e) {
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
