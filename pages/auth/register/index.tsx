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
import { ConnectWallet, useAddress, useConnectionStatus, useDisconnect, useSDK } from "@thirdweb-dev/react";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { Logo } from "components/Logo";
import { SignWalletModal } from "components/Modals/SignWalletModal";
import { useWallet } from "components/Wallet/walletContext";
import { API_SIGN_UP, API_VERIFY_SIGN_UP } from "constants/API";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { OtpRequestBody, PocketBaseManager, SignInData, SignUpData, WalletData } from "lib/pocketBaseManager";
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
import useWalletActions from "components/Wallet/walletActions";

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

  const { showConnectedWallets, setShowConnectedWallets } = useWallet();
  const { onSignMessage, setOnSignMessage } = useWallet();

  const disconnect = useDisconnect();
  const connectionStatus = useConnectionStatus();
  const { walletConnected, setWalletConnected } = useWallet()
  const { messageSigned, setMessageSigned } = useWallet();
  const { message, setMessage } = useWallet()
  const { signature, setSignature } = useWallet()
  const { resetAll } = useWallet()
  let address = useAddress();
  const sdk = useSDK();
  const { walletIsSigned, setWalletIsSigned } = useWallet();

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
    console.log("Connected wallet address is: ", address)
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
      var signUpData = new SignUpData(String("Dummy User"), String(`dummy${address}@dummy.com`), String("12345678"), null);
      const newUser = await pbManager.signUp(signUpData)

      console.log("Newuser:", newUser)
      //save wallet against that user

      if (newUser.code == undefined) {
        //user is created, now save wallet

        const walletData = new WalletData(null, address, newUser.id, message, signature, true)
        const newWalletSaved = await pbManager.saveWallet(walletData)
        console.log("newWalletSaved: ", newWalletSaved)

        const user = await pbManager.fetchUserByWalletId(address)

        console.log("User connected to wallet is: ", user)
        setUser(user)

        if (newWalletSaved.code == undefined) {
          setLoginMode(true);
          router.push("/")
        }

      }


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
      console.log("Inside try");
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
        console.log("Registered: Response: ", response);

        const signInData = new SignInData(String(email), String("12345678"));

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

          setLoginMode(false)
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
      console.log("Error:", err);
      if (err?.type === "server_error") setError(err.payload);
    }
  };

  return (
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
        <span>Already have an account?</span>
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
            router.push("/auth/login")
          }
        })}>Login</Button>
      </Box>

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
      setLoginMode(false);
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
