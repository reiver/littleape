import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { MightLikeCard } from "components/MightLikeCard";
import { LOGJAM_BACKEND_URL, LOGJAM_URL } from "components/Navbar";
import { NewPostCard } from "components/NewPostCard";
import { ProfileHeader } from "components/ProfileHeader";
import { TrendingTags } from "components/TrendingTags";
import { USER_COOKIE } from "constants/app";
import Cookies from "js-cookie";
import { DashboardLayout } from "layouts/Dashboard";
import { checkUserHasBlueSkyLinked } from "lib/utils";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FETCH_USER_PROFILE } from "services/api";
import { useAuthStore } from "store";
import useSWR from "swr";
import { ActivityUser, User } from "types/User";

export default function UserProfile() {
  const [postContent, setPostContent] = useState("")
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const userFromCookie = Cookies.get(USER_COOKIE)

    if (userFromCookie != null && userFromCookie != undefined) {
      const userObj: User = JSON.parse(userFromCookie);
      setAuth(userObj.email, userObj)
      checkUserHasBlueSkyLinked(userObj)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {

      window.addEventListener("message", (event) => {
        if (event.origin == (LOGJAM_URL)) {
          // Process the received data
          
          const receivedData = event.data;

          if (receivedData.from == "logjam") {

            var audienceLink = receivedData.audienceLink

            audienceLink = audienceLink.replace(' ', '%20')

            const url = `${audienceLink}/?host=${LOGJAM_BACKEND_URL}`

            setPostContent(`Join the meeting by using following Link\t\n\n${url}`)

          }
        }
      });

      return

      const hashData = window.location.hash.split("#data=")[1];

      if (hashData) {
        try {
          // Decode and parse the received data
          const receivedData = JSON.parse(decodeURIComponent(hashData));
          setPostContent(null)

          if (receivedData.from == "logjam") {

            var audienceLink = receivedData.audienceLink

            audienceLink = audienceLink.replace(' ', '%20')

            const url = `${audienceLink}/?host=${LOGJAM_BACKEND_URL}`

            setPostContent(`Join the meeting by using following Link\t\n\n${url}`)

            window.location.hash = "";

          }

        } catch (error) {
          console.error("Failed to parse hash data:", error);
          window.location.hash = "";
        }
      } else {
        console.log("No data received in URL hash.");
      }
    }
  }, []);



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
          {user && username == loggedInUser?.username && <NewPostCard defaultValue={postContent} />}
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
