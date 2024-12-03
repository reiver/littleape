import {
  AlertIcon,
  Box,
  FormControl,
  FormErrorMessage,
  Heading,
  PinInput,
  PinInputField,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { Logo } from "components/Logo";
import { SignWalletModal } from "components/Modals/SignWalletModal";
import { BlueSkyLoginButton } from "components/SignInWithBlueSky";
import { SignInWithFarcasterButton } from "components/SignInWithFarcaster";
import { API_SIGN_UP, API_VERIFY_SIGN_UP } from "constants/API";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { OtpRequestBody, PocketBaseManager, SignUpData, SignUpData2, WalletData } from "lib/pocketBaseManager";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, FormEvent, useEffect, useState } from "react";
import { LoginMode, useAuthStore } from "store";
import { Auth } from "types/Auth";
import { Error } from "types/Error";
import { User } from "types/User";
import { ConnectWallet, useAddress, useConnectionStatus, useDisconnect, useSDK, useWallet, useWalletActions } from "web3-wallet-connection";
import { z } from "zod";
import styles from "../MyComponent.module.css";

const pbManager = PocketBaseManager.getInstance();

const registrationSchema = z.object({
  displayname: z.string().min(1),
  email: z.string().email().min(1),
});

const verifySchema = z.object({
  code: z.string().min(6),
  email: z.string().min(1),
});

const RegistrationForm: FC<{
  onRegister: (code: string, email: string) => void;
}> = ({ onRegister }) => {

  const { createMessageAndSign } = useWalletActions();


  const [error, setError] = useState(null);
  const toast = useToast();
  const router = useRouter();
  const loggedInUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoginMode = useAuthStore((state) => state.setLoginMode);
  const loginMode = useAuthStore((state) => state.mode)

  const disconnect = useDisconnect();
  const connectionStatus = useConnectionStatus();
  let address = useAddress();
  const sdk = useSDK();


  const {
    showConnectedWallets,
    setShowConnectedWallets,
    onSignMessage,
    setOnSignMessage,
    walletConnected,
    setWalletConnected,
    messageSigned,
    setMessageSigned,
    message,
    setMessage,
    signature,
    setSignature,
    resetAll,
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

  useEffect(() => {
    if (address != undefined) {
      setWalletConnected(true)

      if (walletIsSigned) {
        loginOrCreateAccount(address)
      }
    } else {
      setWalletConnected(false)
    }

  }, [address, walletIsSigned])

  const loginOrCreateAccount = async (address) => {
    const wallet = await pbManager.getWallet(address)

    if (wallet.code != undefined && wallet.code == 404) {
      toast({
        title: "This wallet is not connected to any account, Creating new Account for that",
        description: ``,
        status: "error",
        duration: 6000,
        isClosable: true,
      });

      //create new user without email
      var signUpData = new SignUpData2({
        email: String(`dummy${address}@littleape.com`),
        password: String("12345678"),
        name: String("Dummy User"),
      });

      const newUser = await pbManager.signUp2(signUpData);

      //save wallet against that user

      if (newUser.code == undefined) {
        //user is created, now save wallet

        const walletData = new WalletData(null, address, newUser.id, message, signature, true)
        const newWalletSaved = await pbManager.saveWallet(walletData)

        const user = await pbManager.fetchUserByWalletId(address)

        setUser(user)

        if (newWalletSaved.code == undefined) {
          setLoginMode(LoginMode.WALLET);
          router.push("/")
        }

      }


    }
    else {
      const user = await pbManager.fetchUserByWalletId(address)
      if (user.code == undefined) {
        setAuth(user.email, user);
        setLoginMode(LoginMode.WALLET)
        router.push("/")
      }
    }
  }

  const { register, errors, getValues, post, loading } = useForm<{
    code: string;
  }>(API_SIGN_UP, { email: "", displayname: "" }, registrationSchema);
  const signUp = (e: FormEvent<HTMLFormElement>) => {
    post(e)
      .then(({ code }) => {
        onRegister(code, String(getValues().email));
      })
      .catch((e) => {
        const err: Error = e.response?._data;
        if (err?.type === "server_error") setError(err.payload);
      });
  };

  const signUpViaPocketBase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { email, displayname } = getValues();

    try {
      var signUpData = new SignUpData(String(displayname), String(email), String("12345678"), null);
      const response = await pbManager.signUp(signUpData);

      if (response.code != undefined) {
        //failed to register
        console.error("Failed to register user: ", response);
        if (response.code == 400) {
          toast({
            title: "The email is invalid or already in use.",
            description: ``,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {

        console.log("User SignedUP: ", response)

        const record = response

        try {

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

        onRegister("200", email.toString());
      }
    } catch (e) {
      toast({
        title: "The email is invalid or already in use.",
        description: ``,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      const err: Error = e.response?._data;
      if (err?.type === "server_error") setError(err.payload);
    }
  };

  const loginOrCreateNewAccountUsingFarcaster = async (username, displayName, fid, bio) => {

    //fetch if user with fid exists or not
    const userByFid = await pbManager.fetchUserByFID(fid);

    if (userByFid.code == undefined) {
      //user aleready exists
      setUser(userByFid)
      router.push("/")
      return;
    }

    toast({
      title: "This Farcaster Account is not linked with any GreatApe Account, Creating new Account...",
      description: ``,
      status: "error",
      duration: 6000,
      isClosable: true,
    });

    //create new user without email
    var signUpData = new SignUpData(String(username), String(`${username}-${fid}@littleape.com`), String("12345678"), null, fid, String(displayName), String(bio));
    const newUser = await pbManager.signUp(signUpData)

    if (newUser.code == undefined) {
      setUser(newUser)
      router.push("/")
    } else {
      setLoginMode(LoginMode.EMAIL)
    }

  }

  return (
    <>
      {!walletIsSigned ? (
        <>
          <Form
            onSubmit={signUpViaPocketBase}
            display="flex"
            flexDirection="column"
            experimental_spaceY={4}
          >
            <Input autoFocus {...register("displayname")} error={errors.displayname} label="Name" />
            <Input {...register("email")} error={errors.email} />
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}
            <Box>
              <Button primary w="full" type="submit" isLoading={loading} mt={error ? 0 : 3}>
                Sign up
              </Button>
            </Box>
          </Form>

          {!walletConnected && (
            <Box>
              <ConnectWallet
                theme={walletConnected ? "light" : "dark"}
                className={walletConnected ? styles.connectButtonAfter : styles.connectButtonLight}
                auth={{ loginOptional: false }}
                btnTitle="Continue With Your Wallet"
                showThirdwebBranding={false}
                onConnect={async (wallet) => {
                  setWalletConnected(true);
                  onSignWalletOpen();
                }}
              />
            </Box>
          )}

          {walletConnected && (
            <Box>
              <Button
                w="full"
                mt={error ? 0 : 3}
                onClick={() => {
                  resetAll();
                  disconnect();
                }}
              >
                Disconnect Wallet
              </Button>
            </Box>
          )}

          <div>
            <SignInWithFarcasterButton
              onSuccess={(res) => {
                if (loginMode != LoginMode.FARCASTER) {
                  console.log("Farcaster Login success: ", res)
                  loginOrCreateNewAccountUsingFarcaster(res.data.username, res.data.displayName, res.data.fid, res.data.bio)
                  setLoginMode(LoginMode.FARCASTER);
                }
              }}
              onError={(err) => {
                console.log("Error SIWF: ", err)
              }}
            />
          </div>

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
            }} />
          <Box
            mt="6"
            display="flex"
            flexDirection="column"
            experimental_spaceY="4"
            textAlign="center"
            color="slate.500"
            _dark={{ color: "slate.400" }}
          >
            <span>Already have an account?</span>
            <Button
              className="block w-full"
              onClick={() => {
                if (walletConnected) {
                  toast({
                    title: "Please disconnect the wallet first!",
                    description: ``,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                } else {
                  resetAll();
                  router.push("/auth/login");
                }
              }}
            >
              Login
            </Button>
          </Box>

          <SignWalletModal
            user={loggedInUser}
            isOpen={isSignWalletOpen}
            onClose={() => {
              onSignWalletClose();
              setShowConnectedWallets(false);
            }}
            onSignMessage={(value) => {
              console.log("Signed Message: ", value)
              return setOnSignMessage(value);
            }}
            forceSign={true}
          />
        </>
      ) : (<div><Text>Loading...</Text></div>)}
    </>
  );


};

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
  const setLoginMode = useAuthStore((state) => state.setLoginMode);
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
      setLoginMode(LoginMode.EMAIL);
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

const Register: FC = () => {
  const [email, setEmail] = useState<string | undefined>(undefined);
  const toast = useToast();
  const { walletIsSigned } = useWallet()
  const onRegister = (code, email) => {
    setEmail(email);
    // toast({
    //   title: "Code [Development]",
    //   description: `Code is: ${code}`,
    //   status: "success",
    //   duration: 9000,
    //   isClosable: true,
    // });
  };
  const backToRegistration = setEmail.bind(null, undefined);

  return (
    <MainLayout>
      <Head>
        <title>GreatApe | Register</title>
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
            Register
          </Heading>
        </Box>
        <Box mt="8">
          {!email ? (
            <RegistrationForm onRegister={onRegister} />
          ) : (
            <VerifyRegistration email={email} backToRegistration={backToRegistration} />
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Register;

export const getServerSideProps = withAuth("notAuthorized", (ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
