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
import { isFediverseMvpMode, isMvpMode } from "./auth/login";
import Logo from '../public/Logo + Type.svg';
import logger from "lib/logger/logger";
import { GetServerSideProps } from "next";

export const getDeviceConfig = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const width = window.innerWidth;

  if (width < 640) {
    return 'xs';
  } else if (width < 768) {
    return 'sm';
  } else if (width < 1024) {
    return 'md';
  } else if (width < 1280) {
    return 'lg';
  } else {
    return '2xl';
  }
};


export const deviceSize = getDeviceConfig()

const pbManager = PocketBaseManager.getInstance()

export default function Home({ appMeta }) {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);
  let user = useAuthStore((state) => state.user);

  useEffect(() => {
    const userFromCookie = Cookies.get(USER_COOKIE)

    if (userFromCookie != null && userFromCookie != undefined) {
      const userObj: User = JSON.parse(userFromCookie);
      setAuth(userObj.email, userObj)
      checkUserHasBlueSkyLinked(userObj)

      if (isMvpMode == true || isFediverseMvpMode == true) {
        //go to meeting page
        router.push(`/@${userObj.username}/host`)
      }

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

  return (
    isMvpMode || isFediverseMvpMode ? (<>
      <Head>
        <title>{appMeta.APP_NAME}</title>
        <meta name="description" content={appMeta.APP_DESCRIPTION} />

        {/* Open Graph */}
        <meta property="og:url" content={appMeta.APP_URL} />
        <meta property="og:type" content="video.other" />
        <meta property="og:title" content={appMeta.APP_NAME} />
        <meta property="og:description" content={appMeta.APP_DESCRIPTION} />
        <meta property="og:image" content={appMeta.IMAGE_URL} />


        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content={appMeta.DOMAIN} />
        <meta property="twitter:url" content={appMeta.APP_URL} />
        <meta name="twitter:title" content={appMeta.APP_NAME} />
        <meta name="twitter:description" content={appMeta.APP_DESCRIPTION} />
        <meta name="twitter:image" content={appMeta.IMAGE_URL} />
      </Head>

      {/* <div className="w-full h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-10">
          <Logo />
          <span className="text-medium-12">Version {process.env.NEXT_PUBLIC_GREATAPE_VERSION}</span>
        </div>
      </div> */}

    </>) : (
      <>
        <Head>
          <title>{appMeta.APP_NAME}</title>
          <meta name="description" content={appMeta.APP_DESCRIPTION} />

          {/* Open Graph */}
          <meta property="og:url" content={appMeta.APP_URL} />
          <meta property="og:type" content="video.other" />
          <meta property="og:title" content={appMeta.APP_NAME} />
          <meta property="og:description" content={appMeta.APP_DESCRIPTION} />
          <meta property="og:image" content={appMeta.IMAGE_URL} />


          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="twitter:domain" content={appMeta.DOMAIN} />
          <meta property="twitter:url" content={appMeta.APP_URL} />
          <meta name="twitter:title" content={appMeta.APP_NAME} />
          <meta name="twitter:description" content={appMeta.APP_DESCRIPTION} />
          <meta name="twitter:image" content={appMeta.IMAGE_URL} />
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

export const getServerSideProps: GetServerSideProps = async (context) => {

  const APP_NAME = `${process.env.NEXT_PUBLIC_CLIENT_NAME}`;
  const APP_DESCRIPTION = process.env.NEXT_PUBLIC_CLIENT_DESCRIPTION || '';
  const DOMAIN = process.env.NEXT_PUBLIC_LITTLEAPE_DOMAIN || '';
  const BASE_URL = process.env.NEXT_PUBLIC_LITTLEAPE_BASE_URL || '';
  const APP_URL = `${BASE_URL}`;
  const IMAGE_URL = `${BASE_URL}/ogimage.png` || '';

  logger.log(" .. appname: ", APP_NAME)

  return {
    props: {
      appMeta: {
        APP_NAME,
        APP_DESCRIPTION,
        APP_URL,
        DOMAIN,
        IMAGE_URL,
      },
    },
  };
};