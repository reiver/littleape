import {
  AlertIcon,
  Box,
  FormControl,
  FormErrorMessage,
  Heading,
  PinInput,
  PinInputField,
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
import { Logo } from "components/Logo";
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
import NeynarLoginButton from "components/NeynarLoginButton";


const pbManager = PocketBaseManager.getInstance();

const schema = z.object({
  email: z.string().email().min(1),
});

const verifySchema = z.object({
  code: z.string().min(6),
  email: z.string().min(1),
});


const Login: FC = () => {
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
        router.push("/")
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
        checkWalletConnectionWithAccount(address)
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
      console.error("Sign in error:", error);
      const err: Error = error.response?._data;
      if (err?.type === "server_error") setError(err.payload);
    }
  };

  const loginUsingFarcaster = async (username, fid) => {

    const user = await pbManager.fetchUserByFID(fid)

    if (user.code == undefined) {
      setUser(user)
      checkUserHasBlueSkyLinked(user)
      router.push("/")
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
    console.log("Show login Blue Sky modal")

  }

  return (
    <MainLayout>
      <Head>
        <title>GreatApe | Login</title>
      </Head>
      <Box mx="auto" mt="10" w="full" maxW={"xs"}>
        <Box
          display="flex"
          alignItems="center"
          experimental_spaceX={"2"}
          textColor="slate.900"
          _dark={{
            textColor: "slate.200",
          }}
        >
          <Logo maxW="8" strokeWidth={2} />
          <Heading as="h1" display="block" textAlign="center" fontSize="3xl" fontWeight="semibold">
            Login
          </Heading>
        </Box>

        {!email ? (
          walletIsSigned ? (
            <div>
              <Text>Loading...</Text>
            </div>
          ) : (
            <div>
              <Form
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

              {
                !walletConnected && <Box>
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

              <div>
                <SignInWithFarcasterButton
                  onSuccess={(res) => {
                    console.log("Success SignInWithFarcasterButton: ", res)
                    if (loginMode != LoginMode.FARCASTER) {
                      console.log("Farcaster Login success: ", res)
                      loginUsingFarcaster(res.data.username, res.data.fid)
                      setLoginMode(LoginMode.FARCASTER);
                    }
                  }}
                  onError={(err) => {
                    console.log("Error SIWF: ", err)
                  }} />
              </div>

              <div>
                <NeynarLoginButton/>
              </div>

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

              <BlueSkyLoginButton
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
                      console.log("Login successfull with Blue Sky: ", _user)
                      setAuth(_user.email, _user);
                      setLoginMode(LoginMode.BLUESKY)
                      router.push("/")
                    }
                  }
                }}

                existingAccountId="" />

              <Box
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

export const getServerSideProps = withAuth("notAuthorized", (ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
