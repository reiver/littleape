import {
  AlertIcon,
  Box,
  FormControl,
  FormErrorMessage,
  Heading,
  PinInput,
  PinInputField,
  Spinner,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { SignInButton } from "@farcaster/auth-kit";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import GreatApeLogo from "../../../public/logo.svg";
import MastodonLogoColor from "../../../public/Mastodon-color.svg";
import PixelfedLogoColor from "../../../public/Pixelfed-color.svg";
import MisskeyLogoColor from "../../../public/Misskey-color.svg";
import PeertubeLogoColor from "../../../public/PeerTube-color.svg";


import { SignWalletModal } from "components/Modals/SignWalletModal";
import { API_VERIFY_SIGN_UP } from "constants/API";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { OtpRequestBody, PocketBaseManager, SignInData } from "lib/pocketBaseManager";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, FormEvent, useEffect, useState } from "react";
import { LoginMode, useAuthStore } from "store";
import { Auth } from "types/Auth";
import { Error } from "types/Error";
import { User } from "types/User";
import {
  ConnectWallet,
  useAddress,
  useConnectionStatus,
  useDisconnect,
  useSDK,
  useWallet,
  useWalletActions
} from "web3-wallet-connection";
import { z } from "zod";
import styles from "../MyComponent.module.css";
import { SignInWithFarcasterButton } from "components/SignInWithFarcaster";
import { BlueSkyLoginButton } from "components/SignInWithBlueSky";
import { BlueSkyApi } from "lib/blueSkyApi";
import { checkUserHasBlueSkyLinked } from "lib/utils";
import { MastodonLoginButton } from "components/SignInWithMastodon";
import { PixelfedLoginButton } from "components/SignInWithPixelfed";
import { MisskeyLoginButton } from "components/SignInWithMisskey";
import { BlueSkyLoginButtonNew } from "components/SignInWithBlueSkyNew";
import { PeerTubeLoginButton } from "components/SignInWithPeerTube";
import { SocialInstancesListComponent } from "components/SocialInstancesListComponent";
import logger from "lib/logger/logger";
import { GetServerSideProps } from "next";
import Cookies from "js-cookie";
import { AUTH_KEY, FORCE_LOGIN, USER_COOKIE } from "constants/app";
export const isMvpMode = process.env.NEXT_PUBLIC_MVP_MODE === "true"
export const isFediverseMvpMode = process.env.NEXT_PUBLIC_FEDIVCERSE_MVP_MODE === "true"

const pbManager = PocketBaseManager.getInstance();

const schema = z.object({
  email: z.string().email().min(1),
});

const verifySchema = z.object({
  code: z.string().min(6),
  email: z.string().min(1),
});

export enum SocialPlatform {
  MASTODON = "Mastodon",
  PIXELFED = "Pixelfed",
  PEERTUBE = "PeerTube",
  MISSKEY = "Misskey"
}

type LoginProps = {
  appMeta: {
    APP_NAME: string;
    APP_DESCRIPTION: string;
    APP_URL: string;
    DOMAIN: string;
    IMAGE_URL: string;
  };
};


const Login: FC<LoginProps> = ({ appMeta }) => {
  const [email, setEmail] = useState<string | undefined>(undefined);
  const router = useRouter();
  const [error, setError] = useState(null);
  const { register, errors, loading, getValues } = useForm<{
    auth: Auth;
    user: User;
  }>(null, { email: "" }, schema);

  const setUser = useAuthStore((state) => state.setUser);

  const { createMessageAndSign } = useWalletActions();

  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoginMode = useAuthStore((state) => state.setLoginMode);
  const loginMode = useAuthStore((state) => state.mode)
  const loggedInUser = useAuthStore((state) => state.user);
  const [mastodonUser, setMastodonUser] = useState(null)
  const [pixelfedUser, setPixelfedUser] = useState(null)
  const [misskeyUser, setMisskeyUser] = useState(null)
  const [peerTubeUser, setPeerTubeUser] = useState(null)



  const toast = useToast();
  const disconnect = useDisconnect();
  const backToRegistration = setEmail.bind(null, undefined);
  const connectionStatus = useConnectionStatus();
  let address = useAddress();
  const sdk = useSDK();

  const {
    walletConnected,
    setWalletConnected,
    messageSigned,
    setMessageSigned,
    message,
    setMessage,
    signature,
    setSignature,
    resetAll,
    showConnectedWallets,
    setShowConnectedWallets,
    onSignMessage,
    setOnSignMessage,
    walletIsSigned,
    setWalletIsSigned,
  } = useWallet();

  useEffect(() => {
    if (router) {
      if (Cookies.get(FORCE_LOGIN) == "true") {
        Cookies.set(FORCE_LOGIN, "false")
      } else {
        goToHostMeetingPage()
      }
    }
  }, [router])

  const goToHostMeetingPage = () => {
    const userFromCookie = Cookies.get(USER_COOKIE)

    if (userFromCookie != null && userFromCookie != undefined) {
      const userObj: User = JSON.parse(userFromCookie);
      if (userObj == null) {
        return
      }
      setAuth(userObj.email, userObj)
      router.push(`/@${userObj.username}/host`)
    }
  }


  const {
    isOpen: isSignWalletOpen,
    onOpen: onSignWalletOpen,
    onClose: onSignWalletClose,
  } = useDisclosure();

  useEffect(() => {
    //sign message only if onSignMessage is true
    if (onSignMessage) {
      createMessageAndSign()
    }
  }, [onSignMessage])

  const generateUserName = (url, name) => {
    const domain = new URL(url).hostname;
    return `${name}@${domain}`
  }

  //mastodon data
  useEffect(() => {
    if (router.query.mastodonuser) {
      try {
        const userData = JSON.parse(decodeURIComponent(router.query.mastodonuser as string));
        setMastodonUser(userData);

        const extractedUserName = generateUserName(userData.url, userData.username)

        toast({
          title: "Successful Login to Mastodon",
          description: ``,
          status: "success",
          duration: 6000,
          isClosable: true,
        });

        // Mapping to User type
        const mappedUser: Partial<User> = {
          id: Number(userData.id), // Converting id from string to number
          avatar: userData.avatar,
          banner: userData.header, // Using header as banner
          bio: userData.note.replace(/<\/?p>/g, ""), // Removing HTML tags from bio
          name: userData.display_name,
          username: extractedUserName,
          blueskyid: null,
        };

        setUser(mappedUser)
        goToHostMeetingPage()

      } catch (error) {
        logger.error("Error parsing Mastodon user data:", error);
        router.replace(router.pathname, undefined, { shallow: true });
      }

    }
  }, [router.query.mastodonuser]);

  useEffect(() => {
    if (router.query.mastodonerror) {
      try {
        const errorData = JSON.parse(decodeURIComponent(router.query.mastodonerror as string));
        logger.log("Error Data:", errorData);

        toast({
          title: "Failed to Authenticate with Mastodon",
          description: ``,
          status: "error",
          duration: 6000,
          isClosable: true,
        });

      } catch (error) {
        logger.error("Error parsing Mastodon error data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.mastodonerror]);

  //pixelfed data
  useEffect(() => {
    if (router.query.pixelfeduser) {
      try {
        const userData = JSON.parse(decodeURIComponent(router.query.pixelfeduser as string));
        setPixelfedUser(userData);

        const extractedUserName = generateUserName(userData.url, userData.username)

        toast({
          title: "Successful Login to Pixelfed",
          description: ``,
          status: "success",
          duration: 6000,
          isClosable: true,
        });

        // Mapping to User type
        const mappedUser: Partial<User> = {
          id: Number(userData.id), // Convert ID from string to number
          avatar: userData.avatar,
          banner: userData.header, // Using header as banner
          bio: userData.note.trim(), // Removing extra spaces from bio
          name: userData.display_name,
          username: extractedUserName,
          blueskyid: null,
        };

        setUser(mappedUser)
        goToHostMeetingPage()

      } catch (error) {
        logger.error("Error parsing Pixelfed user data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.pixelfeduser]);

  useEffect(() => {
    if (router.query.pixelfederror) {
      try {
        const errorData = JSON.parse(decodeURIComponent(router.query.pixelfederror as string));
        logger.log("Error Data:", errorData);

        toast({
          title: "Failed to Authenticate with Pixelfed",
          description: ``,
          status: "error",
          duration: 6000,
          isClosable: true,
        });

      } catch (error) {
        logger.error("Error parsing Pixelfed error data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.pixelfederror]);

  //misskey data
  useEffect(() => {
    if (router.query.misskeyuser) {
      try {
        const userData = JSON.parse(decodeURIComponent(router.query.misskeyuser as string));
        setMisskeyUser(userData);

        const extractedUserName = generateUserName(userData.avatarUrl, userData.username)

        toast({
          title: "Successful Login to Misskey",
          description: ``,
          status: "success",
          duration: 6000,
          isClosable: true,
        });

        // Mapping to User type
        const mapMisskeyUserToUser = (misskeyUser: any): User => ({
          id: Number(misskeyUser.id) || undefined,
          avatar: misskeyUser.avatarUrl ?? "",
          banner: misskeyUser.bannerUrl ?? "",
          bio: misskeyUser.description ?? "",
          name: misskeyUser.name ?? "",
          username: extractedUserName ?? "",
        });

        const mappedUser = mapMisskeyUserToUser(userData)

        setUser(mappedUser)
        goToHostMeetingPage()

      } catch (error) {
        logger.error("Error parsing Misskey user data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.misskeyuser]);

  useEffect(() => {
    if (router.query.misskeyerror) {
      try {
        const errorData = JSON.parse(decodeURIComponent(router.query.misskeyerror as string));
        logger.log("Error Data:", errorData);

        toast({
          title: "Failed to Authenticate with Misskey",
          description: ``,
          status: "error",
          duration: 6000,
          isClosable: true,
        });

      } catch (error) {
        logger.error("Error parsing Misskey error data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.misskeyerror]);

  //peer tube
  useEffect(() => {
    if (router.query.peertubeuser) {
      try {
        const userData = JSON.parse(decodeURIComponent(router.query.peertubeuser as string));
        setPeerTubeUser(userData);
        logger.log("Peertube user: ", userData)

        const extractedUserName = generateUserName(userData.url, userData.name)


        toast({
          title: "Successful Login to Peertube",
          description: ``,
          status: "success",
          duration: 6000,
          isClosable: true,
        });

        // Mapping to User type
        const mapPeertubeUserToUser = (peerTubeUser: any): User => ({
          id: Number(peerTubeUser.id) || undefined,
          bio: peerTubeUser.description ?? "",
          name: peerTubeUser.displayName ?? "",
          username: extractedUserName ?? "",
        });

        const mappedUser = mapPeertubeUserToUser(userData)

        setUser(mappedUser)
        goToHostMeetingPage()

      } catch (error) {
        logger.error("Error parsing Peertube user data:", error);
      }

      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.peertubeuser]);

  useEffect(() => {
    if (router.query.peertubeerror) {
      toast({
        title: "Failed to Authenticate with Peertube",
        description: ``,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.peertubeerror]);


  const checkWalletConnectionWithAccount = async (address) => {
    const wallet = await pbManager.getWallet(address)

    if (wallet.code != undefined && wallet.code == 404) {
      toast({
        title: "This wallet is not connected to any account, please Login using Email Or Regsiter via Wallet",
        description: ``,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
    else {
      //get associated user from wallet
      const user = await pbManager.fetchUserByWalletId(address)
      if (user.code == undefined) {
        setAuth(user.email, user);
        setLoginMode(LoginMode.WALLET)
        checkUserHasBlueSkyLinked(user)
        goToHostMeetingPage()
      }
    }
  }

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (connectionStatus === "disconnected") {
        resetAll()
        address = undefined
      }
    }
    checkWalletStatus()
  }, [walletConnected])

  useEffect(() => {
    if (address != undefined) {
      setWalletConnected(true)

      if (walletIsSigned) {
        if (isMvpMode) {
          const mappedUser: Partial<User> = {
            username: address,
          };
          setUser(mappedUser)
          goToHostMeetingPage()
        } else {
          checkWalletConnectionWithAccount(address)
        }
      }
    } else {
      setWalletConnected(false)
    }

  }, [address, walletIsSigned])

  const handleLoginViaPocketBase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (walletConnected) {
      toast({
        title: "Please disconnect the wallet first!",
        description: ``,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return
    }

    const { email } = getValues();

    const signInData = new SignInData(String(email), String("12345678"));

    try {
      const authData = await pbManager.signIn(signInData);
      setEmail(String(email));

      var record = authData.record;

      const user: User = {
        api_key: "",
        avatar: record.avatar,
        banner: "",
        bio: "",
        name: record.name,
        email: record.email,
        github: "",
        id: record.id,
        publicKey: "",
        username: record.username,
      };

      setLoginMode(LoginMode.EMAIL)
      checkUserHasBlueSkyLinked(user)
      setAuth(record.email, user);
    } catch (error) {
      toast({
        title: "The email is invalid.",
        description: ``,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      logger.error("Sign in error:", error);
      const err: Error = error.response?._data;
      if (err?.type === "server_error") setError(err.payload);
    }
  };

  const loginUsingFarcaster = async (username, fid) => {

    const user = await pbManager.fetchUserByFID(fid)

    if (user.code == undefined) {
      setUser(user)
      checkUserHasBlueSkyLinked(user)
      goToHostMeetingPage()
    } else {
      toast({
        title: "This Farcaster Account is not linked with any GreatApe Account, Please Register using Farcaster",
        description: ``,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      setLoginMode(LoginMode.EMAIL)
    }

  }

  const showLoginBlueSkyModal = async () => {
    logger.log("Show login Blue Sky modal")

  }


  const clearCookies = () => {
    Cookies.set(USER_COOKIE, null)
    Cookies.set(FORCE_LOGIN, null)
    Cookies.set(AUTH_KEY, null)
  }



  const [showSocialInsatncesList, setShowSocialInsatncesList] = useState(false)
  const [loginPlatform, setLoginPlatform] = useState("")
  const handleMastodonButtonClick = () => {
    clearCookies()
    setShowSocialInsatncesList(true)
    setLoginPlatform(SocialPlatform.MASTODON)
  }

  const handlePixelfedButtonClick = () => {
    clearCookies()
    setShowSocialInsatncesList(true)
    setLoginPlatform(SocialPlatform.PIXELFED)
  }

  const handleMisskeyButtonClick = () => {
    clearCookies()
    setShowSocialInsatncesList(true)
    setLoginPlatform(SocialPlatform.MISSKEY)
  }

  const handlePeertubeButtonClick = () => {
    clearCookies()
    setShowSocialInsatncesList(true)
    setLoginPlatform(SocialPlatform.PEERTUBE)
  }

  const handleBackToLogin = () => {
    setShowSocialInsatncesList(false)
    setLoginPlatform("")
  }

  const getSocialLogo = () => {
    if (loginPlatform == SocialPlatform.MASTODON) {
      return <MastodonLogoColor />
    } else if (loginPlatform == SocialPlatform.PIXELFED) {
      return <PixelfedLogoColor />
    } else if (loginPlatform == SocialPlatform.MISSKEY) {
      return <MisskeyLogoColor />
    } else if (loginPlatform == SocialPlatform.PEERTUBE) {
      return <PeertubeLogoColor />
    }
    return <></>
  }
  return (
    <MainLayout>
      <Head>
        <title>{appMeta.APP_NAME}</title>
        <meta name="description" content={appMeta.APP_DESCRIPTION} />

        {/* Open Graph */}
        <meta property="og:url" content={appMeta.APP_URL} />
        <meta property="og:type" content="website" />
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
      <div className={`w-full max-w-[632px] ${showSocialInsatncesList ? `max-h-[752px]` : `max-h-[703px]`} mx-auto mt-6 pb-8 md:border md:rounded-2xl bg-white`}>
        <Box mx="auto" mt="10" w="full" className="max-w-[416px]">

          {
            !showSocialInsatncesList && <>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                textColor="slate.900"
                _dark={{ textColor: "slate.200" }}
              >
                <Box display="flex" justifyContent="center" width="100%">
                  <GreatApeLogo />
                </Box>
                <Text className="text-secondary-1-a text-semi-bold-32 mt-6">
                  Welcome!
                </Text>
                {
                  isMvpMode == true && <Text className="text-gray-2 text-regular-16 mt-2">
                    Please enter your info. to continue
                  </Text>
                }
                {
                  isFediverseMvpMode == true && <Text className="text-gray-2 text-regular-16 mt-2">
                    Please choose a login option:
                  </Text>
                }
              </Box>

              {
                isMvpMode && <BlueSkyLoginButtonNew onLoginSuccess={(user) => {
                  setUser(user)
                  goToHostMeetingPage()
                }} existingAccountId="" />
              }

              {
                isMvpMode == true && <div className="flex items-center gap-4 mt-6 mb-6">
                  <div className="flex-1 h-[2px] bg-gray-0" />
                  <Text className="text-gray-400 text-[16px]">Or Continue With</Text>
                  <div className="flex-1 h-[2px] bg-gray-0" />
                </div>
              }


              <div className={`${isMvpMode ? 'flex' : ''} items-center gap-4 justify-center ${isFediverseMvpMode ? 'mt-4' : ''}`}>
                <MastodonLoginButton onButtonClick={handleMastodonButtonClick} />

                <PixelfedLoginButton onButtonClick={handlePixelfedButtonClick} />

                <MisskeyLoginButton onButtonClick={handleMisskeyButtonClick} />

                <PeerTubeLoginButton onButtonClick={handlePeertubeButtonClick} />

                {
                  isMvpMode == true && <SignInWithFarcasterButton
                    onSuccess={(res) => {
                      logger.log("Success SignInWithFarcasterButton: ", res)
                      if (loginMode != LoginMode.FARCASTER) {
                        logger.log("Farcaster Login success: ", res)

                        if (isMvpMode) {
                          const mappedUser: Partial<User> = {
                            username: res.data.username,
                          };
                          setUser(mappedUser)
                          goToHostMeetingPage()
                        } else {
                          loginUsingFarcaster(res.data.username, res.data.fid)
                          setLoginMode(LoginMode.FARCASTER);
                        }

                      }
                    }}
                    onError={(err) => {
                      logger.log("Error SIWF: ", err)
                    }} />
                }

              </div>
            </>
          }


          {
            showSocialInsatncesList &&
            <SocialInstancesListComponent logo={getSocialLogo()} title={loginPlatform} goBack={handleBackToLogin} />
          }

          {!email ? (
            walletIsSigned ? (
              <div>
                <Text>Loading...</Text>
              </div>
            ) : (
              <div>
                {
                  isMvpMode == false && isFediverseMvpMode == false && <Form
                    onSubmit={handleLoginViaPocketBase}
                    mt="8"
                    display="flex"
                    flexDirection="column"
                    experimental_spaceY={4}
                  >
                    <Input autoFocus {...register("email")} error={errors.email} />
                    {error && (
                      <Alert status="error">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                    <Box>
                      <Button primary w="full" type="submit" mt={error ? 0 : 3} isLoading={loading}>
                        Login
                      </Button>
                    </Box>
                  </Form>
                }

                {
                  isMvpMode == false && isFediverseMvpMode == false && !walletConnected && <Box>
                    <ConnectWallet
                      theme={walletConnected ? "light" : "dark"}
                      className={walletConnected ? styles.connectButtonAfter : styles.connectButtonLight}
                      auth={{ loginOptional: false }}
                      btnTitle="Continue With Your Wallet"
                      showThirdwebBranding={false}
                      onConnect={async (wallet) => {
                        setWalletConnected(true);
                        onSignWalletOpen()
                      }}
                    />
                  </Box>
                }


                {
                  walletConnected && <Box>
                    <Button w="full" mt={error ? 0 : 3} onClick={() => {
                      resetAll()
                      disconnect()
                    }}>
                      Disconnect Wallet
                    </Button>
                  </Box>
                }

                {/* Show blue sky login modal only if not mvp */}
                {
                  isMvpMode == false && isFediverseMvpMode == false && <BlueSkyLoginButton

                    onClose={(user?: any) => {

                      if (user != null && user != undefined) {
                        if (user.record == null || user.record == undefined) {
                          toast({
                            title: user,
                            description: ``,
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                          });
                        } else {
                          const _user = user.record
                          logger.log("Login successfull with Blue Sky: ", _user)
                          setAuth(_user.email, _user);
                          setLoginMode(LoginMode.BLUESKY)
                          goToHostMeetingPage()
                        }
                      }
                    }}

                    existingAccountId="" />
                }


                {
                  isMvpMode == false && isFediverseMvpMode == false && <Box
                    mt="6"
                    display="flex"
                    flexDirection="column"
                    experimental_spaceY="4"
                    textAlign="center"
                    color="slate.500"
                    _dark={{ color: "slate.400" }}
                  >
                    <span>Don&rsquo;t have an account?</span>
                    <Button className="block w-full" onClick={(() => {
                      if (walletConnected) {
                        toast({
                          title: "Please disconnect the wallet first!",
                          description: ``,
                          status: "error",
                          duration: 3000,
                          isClosable: true,
                        });
                        return
                      } else {
                        resetAll()
                        router.push("/auth/register")
                      }
                    })}>Register now</Button>
                  </Box>
                }


              </div>
            )

          ) : (
            <VerifyRegistration email={email} backToRegistration={backToRegistration} />
          )}

          <SignWalletModal
            user={loggedInUser}
            isOpen={isSignWalletOpen}
            onClose={(() => {
              onSignWalletClose()
              setShowConnectedWallets(false)
            })}
            onSignMessage={(value) => {
              return setOnSignMessage(value);
            }}
            forceSign={true}
          />

        </Box>
      </div>
    </MainLayout>
  );
};

export default Login;

const pinInputProps = {
  borderColor: "gray.300",
  bg: "light.200",
  _dark: {
    borderColor: "gray.600",
    bg: "dark.500",
    _hover: { bg: "dark.600" },
    _focus: {
      bg: "#393E4F",
    },
  },
  _invalid: {
    borderColor: "red.400 !important",
    _focusWithin: {
      ringColor: "red.300",
      borderColor: "red.500 !important",
    },
  },
};

const VerifyRegistration: FC<{
  email: string;
  backToRegistration: () => void;
}> = ({ backToRegistration, email }) => {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState(null);
  const { setValue, errors, post, loading, getValues } = useForm<{
    auth: Auth;
    user: User;
  }>(API_VERIFY_SIGN_UP, { code: "", email }, verifySchema);
  const verify = async (e) => {
    e.preventDefault();
    const { code } = getValues();

    var otpRequest = new OtpRequestBody(code, email);
    const response = await pbManager.verifyOtp(otpRequest);
    if (response.code == "200") {
      toast({
        title: "OTP verified",
        description: ``,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/");
    } else if (response.code == "201") {
      toast({
        title: "Invalid OTP",
        description: `Please enter valid OTP`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else if (response.code == "202") {
      toast({
        title: "User not found",
        description: `User with ${email} not found`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Form onSubmit={verify}>
        <VStack experimental_spaceY={5}>
          <Text w="full" textAlign="left" _dark={{ color: "gray.400" }}>
            Enter the code we just sent you on your email address.
          </Text>
          <FormControl isInvalid={!!errors.code}>
            <Box display="flex" justifyContent="space-between" w="full">
              <PinInput autoFocus onChange={(code) => setValue("code", code)} otp size="lg">
                <PinInputField {...pinInputProps} />
                <PinInputField {...pinInputProps} />
                <PinInputField {...pinInputProps} />
                <PinInputField {...pinInputProps} />
                <PinInputField {...pinInputProps} />
                <PinInputField {...pinInputProps} />
              </PinInput>
              {!!errors.code && <FormErrorMessage>{errors.code.message}</FormErrorMessage>}
            </Box>
          </FormControl>
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Button isLoading={loading} primary w="full" type="submit" mt={error ? 0 : 3}>
            Verify
          </Button>
        </VStack>
      </Form>
      <Box
        mt="6"
        display="flex"
        flexDirection="column"
        experimental_spaceY="4"
        textAlign="center"
        color="slate.500"
        _dark={{ color: "slate.400" }}
      >
        <span>Back to registration?</span>
        <Button onClick={backToRegistration} className="block w-full">
          Registration
        </Button>
      </Box>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {

  const APP_NAME = `${process.env.NEXT_PUBLIC_CLIENT_NAME} — Login`;
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