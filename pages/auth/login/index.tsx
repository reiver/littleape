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
import {
  ConnectWallet,
  useAddress,
  useConnectionStatus,
  useDisconnect,
  useSDK,
} from "@thirdweb-dev/react";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { Logo } from "components/Logo";
import { SignWalletModal, createMessage } from "components/ProfileHeader";
import { useWallet } from "components/Wallet/walletContext";
import { API_VERIFY_SIGN_UP } from "constants/API";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { OtpRequestBody, PocketBaseManager, SignInData } from "lib/pocketBaseManager";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, FormEvent, useEffect, useState } from "react";
import { useAuthStore } from "store";
import { Auth } from "types/Auth";
import { Error } from "types/Error";
import { User } from "types/User";
import { z } from "zod";
import styles from "../MyComponent.module.css";


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

  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();
  const disconnect = useDisconnect();
  const backToRegistration = setEmail.bind(null, undefined);
  const connectionStatus = useConnectionStatus();
  const { walletConnected, setWalletConnected } = useWallet()
  const { messageSigned, setMessageSigned } = useWallet();
  const { message, setMessage } = useWallet()
  const { signature, setSignature } = useWallet()
  const { resetAll } = useWallet()
  let address = useAddress();
  const sdk = useSDK();

  const loggedInUser = useAuthStore((state) => state.user);
  const { showConnectedWallets, setShowConnectedWallets } = useWallet();
  const { onSignMessage, setOnSignMessage } = useWallet();
  const { walletIsSigned, setWalletIsSigned } = useWallet();
  const { setEnsList } = useWallet()


  const {
    isOpen: isSignWalletOpen,
    onOpen: onSignWalletOpen,
    onClose: onSignWalletClose,
  } = useDisclosure();

  useEffect(() => {
    //sign message only if onSignMessage is true
    if (onSignMessage) {
      console.log("onSignMessage: ", onSignMessage)
      createMessageAndSign()
    }
  }, [onSignMessage])

  const createMessageAndSign = async () => {
    console.log("Addess: ", address)
    console.log("walletConnected: ", walletConnected)
    console.log("messageSigned: ", messageSigned)
    if (address != undefined && walletConnected && !messageSigned) {
      console.log("Address is : ", address)
      console.log("SDK is: ", sdk.wallet)

      const message = await createMessage(address)

      //sign message
      await signMessage(`\x19Ethereum Signed Message:\n${message.length}${message}`)
    }
  };


  const signMessage = async (message) => {
    console.log("MESAAGE:", message)

    try {
      const sig = await sdk?.wallet?.sign(message);

      if (!sig) {
        throw new Error('Failed to sign message');
      }

      setMessageSigned(true)
      setMessage(message)
      setSignature(sig);
      setWalletIsSigned(true)
    } catch (error) {
      console.log("Error while signing: ", error)
      setMessageSigned(false)
      setOnSignMessage(false)
    }


  }


  const checkWalletConnectionWithAccount = async (address) => {
    console.log("Connected wallet address is: ", address)
    const wallet = await pbManager.getWallet(address)
    console.log("Wallet in DB: ", wallet)

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
      const userId = wallet.userId;

      const user = await pbManager.fetchUserById(userId)
      console.log("user by id: ", user)

      if (user.code == undefined) {
        const signInData = new SignInData(String(user.email), String("12345678"));

        try {
          const authData = await pbManager.signIn(signInData);
          console.log("Sign in successful:", authData);

          var record = authData.record;

          const user: User = {
            api_key: "",
            avatar: record.avatar,
            banner: "",
            bio: "",
            display_name: record.name,
            email: record.email,
            github: "",
            id: record.id,
            publicKey: "",
            username: record.username,
          };

          setAuth(record.email, user);

          router.push("/")
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
      console.log("Sign in successful:", authData);

      setEmail(String(email));

      var record = authData.record;

      const user: User = {
        api_key: "",
        avatar: record.avatar,
        banner: "",
        bio: "",
        display_name: record.name,
        email: record.email,
        github: "",
        id: record.id,
        publicKey: "",
        username: record.username,
      };

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
                    console.log("connected to", wallet);
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
            console.log("On Sign message Triggered: ", value)
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState(null);
  const { setValue, errors, post, loading, getValues } = useForm<{
    auth: Auth;
    user: User;
  }>(API_VERIFY_SIGN_UP, { code: "", email }, verifySchema);
  const verify = async (e) => {
    e.preventDefault();
    const { code } = getValues();

    var otpRequest = new OtpRequestBody(code, email);
    console.log("Sending OTP: ", code);
    const response = await pbManager.verifyOtp(otpRequest);
    console.log("Otp response: ", response);
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
