import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { MightLikeCard } from "components/MightLikeCard";
import { LOGJAM_URL } from "components/Navbar";
import { NewPostCard } from "components/NewPostCard";
import { ProfileHeader } from "components/ProfileHeader";
import { TrendingTags } from "components/TrendingTags";
import { USER_COOKIE } from "constants/app";
import Cookies from "js-cookie";
import { DashboardLayout } from "layouts/Dashboard";
import logger from "lib/logger/logger";
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
  let lastOpenedAt = null;

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

            if (audienceLink != undefined && audienceLink != "") {
              audienceLink = audienceLink.replace(' ', '%20')

              const url = `${audienceLink}`

              setPostContent(`Join the meeting by using following Link\t\n\n${url}`)
            }

            if (receivedData.startMeeting == true) {

              // Check if the window was opened within the last 20 seconds

              // Get the current timestamp
              const currentTime = Date.now();

              if (lastOpenedAt && currentTime - lastOpenedAt < 20000) {
                logger.log("Meeting window was opened recently. Try again later.");
                return
              }

              //start meeting in new tab inside iframe
              if (window.location.href != undefined && window.location.href != "" && !window.location.href.includes("/host")) {
                logger.log("Received data going to open new window for meeting: ", window.location.href)

                // Prepare the data to send
                const dataToSend = {
                  to: "iframe",
                  from: "littleape",
                  roomname: receivedData.roomName,
                  username: receivedData.displayName,
                  hostLink: receivedData.hostLink,
                  audienceLink: receivedData.audienceLink,
                  topWindowUrl: window.location.origin,
                };

                // Serialize the data into a URL hash
                const hashData = encodeURIComponent(JSON.stringify(dataToSend));

                //open host page
                window.open(`${window.location.origin}/@${receivedData.displayName}/host#start-meeting=${hashData}`, "_blank");

                // Get the current timestamp in milliseconds
                lastOpenedAt = Date.now();
              }

            }
          }
        }
      });

      return
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
        <title>GreatApe</title>
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
    username: "",
  };
  //   try {
  //     user = await serverFetch(API_USER_PROFILE(username), ctx.req, {
  //       activityPub: true,
  //     });
  //   } catch (e) {
  //     logger.error(e);
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
