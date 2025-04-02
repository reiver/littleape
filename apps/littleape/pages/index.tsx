import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { Footer } from "components/Footer";
import { MainMenu } from "components/MainMenu";
import { MightLikeCard } from "components/MightLikeCard";
import { LOGJAM_URL } from "components/Navbar";
import { NewPostCard } from "components/NewPostCard";
import { ProfileCard } from "components/ProfileCard";
import { TrendingTags } from "components/TrendingTags";
import { AUTH_KEY, USER_COOKIE } from "constants/app";
import Cookies from "js-cookie";
import { DashboardLayout } from "layouts/Dashboard";
import { PocketBaseManager } from "lib/pocketBaseManager";
import { checkUserHasBlueSkyLinked } from "lib/utils";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthStore } from "store";
import { User } from "types/User";
import { useAddress } from "web3-wallet-connection";
import { useRouter } from "next/router";

const pbManager = PocketBaseManager.getInstance()

export default function Home() {
  const router = useRouter();
  const redirectToLogin = true

  const setAuth = useAuthStore((state) => state.setAuth);
  let user = useAuthStore((state) => state.user);

  useEffect(() => {
    const userFromCookie = Cookies.get(USER_COOKIE)

    if (userFromCookie != null && userFromCookie != undefined) {
      const userObj: User = JSON.parse(userFromCookie);
      setAuth(userObj.email, userObj)
      checkUserHasBlueSkyLinked(userObj)

      //go to meeting page
      router.push(`/@${userObj.username}/host`)

    } else {
      //go to login page
      router.push("/auth/login");
    }
  }, [])

  const address = useAddress()

  const [postContent, setPostContent] = useState("")

  let lastOpenedAt = null;

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
                console.log("Meeting window was opened recently. Try again later.");
                return
              }

              //start meeting in new tab inside iframe
              if (window.location.href != undefined && window.location.href != "") {
                console.log("Received data going to open new window for meeting: ", window.location.href)

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

  return (
    redirectToLogin ? (<>
      <Head>
        <title>Greatape</title>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </Head></>) : (
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
            <NewPostCard defaultValue={postContent} />
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
    )
  );
}

// export const getServerSideProps = withAuth("authorized", (ctx) => {
//   return {
//     props: {
//       ...authProps(ctx),
//     },
//   };
// });
