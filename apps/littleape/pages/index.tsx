import { Box } from "@chakra-ui/react";
import { Feed } from "components/Feed";
import { Footer } from "components/Footer";
import { MainMenu } from "components/MainMenu";
import { MightLikeCard } from "components/MightLikeCard";
import { LOGJAM_BACKEND_URL, LOGJAM_URL } from "components/Navbar";
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

const pbManager = PocketBaseManager.getInstance()

export default function Home() {

  const setAuth = useAuthStore((state) => state.setAuth);
  let user = useAuthStore((state) => state.user);

  useEffect(() => {
    const userFromCookie = Cookies.get(USER_COOKIE)

    if (userFromCookie != null && userFromCookie != undefined) {
      const userObj: User = JSON.parse(userFromCookie);
      setAuth(userObj.email, userObj)
      checkUserHasBlueSkyLinked(userObj)
    }
  }, [])

  const address = useAddress()

  const [postContent, setPostContent] = useState("")

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

              const url = `${audienceLink}/?host=${LOGJAM_BACKEND_URL}`

              setPostContent(`Join the meeting by using following Link\t\n\n${url}`)
            }
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

      window.location.hash = "";
    }
  }, []);

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
  );
}

// export const getServerSideProps = withAuth("authorized", (ctx) => {
//   return {
//     props: {
//       ...authProps(ctx),
//     },
//   };
// });
