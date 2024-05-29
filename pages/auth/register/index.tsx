import {
  AlertIcon,
  Box,
  FormControl,
  FormErrorMessage,
  Heading,
  PinInput,
  PinInputField,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { Logo } from "components/Logo";
import { API_SIGN_UP, API_VERIFY_SIGN_UP } from "constants/API";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { OtpRequestBody, PocketBaseManager, SignUpData } from "lib/pocketBaseManager";
import { authProps, withAuth } from "lib/withAuth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, FormEvent, useState } from "react";
import { useAuthStore } from "store";
import { Auth } from "types/Auth";
import { Error } from "types/Error";
import { User } from "types/User";
import { z } from "zod";
const pbManager = PocketBaseManager.getInstance();

const registrationSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().min(1),
  password: z.string().min(1),
});

const verifySchema = z.object({
  code: z.string().min(6),
  email: z.string().min(1),
});

const RegistrationForm: FC<{
  onRegister: (code: string, email: string) => void;
}> = ({ onRegister }) => {
  const [error, setError] = useState(null);
  const { register, errors, getValues, post, loading } = useForm<{
    code: string;
  }>(API_SIGN_UP, { email: "", password: "", username: "" }, registrationSchema);
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
    const { email, password, username } = getValues();

    try {
      console.log("Inside try");
      var signUpData = new SignUpData(String(username), String(email), String(password), null);
      const response = await pbManager.signUp(signUpData);

      if (response.code != undefined) {
        //failed to register
        console.error("Failed to register user: ", response);
      } else {
        console.log("Registered: Response: ", response);

        // const verify = await pbManager.verifyEmail(String(email));
        // console.log("Verify: ", verify);

        onRegister("200", email.toString());
      }
    } catch (e) {
      const err: Error = e.response?._data;
      console.log("Error:",err)
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
        <Input autoFocus {...register("username")} error={errors.username} label="Username" />
        <Input {...register("email")} error={errors.email} />
        <Input type="password" {...register("password")} error={errors.password} />
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
        <Link href="/auth/login">
          <Button className="block w-full">Login</Button>
        </Link>
      </Box>
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState(null);
  const { setValue, errors, post, loading,getValues } = useForm<{
    auth: Auth;
    user: User;
  }>(API_VERIFY_SIGN_UP, { code: "", email }, verifySchema);
  const verify = async (e) => {
    e.preventDefault();
    const { code} = getValues();
  
    // post(e)
    //   .then(({ auth, user }) => {
    //     setAuth(auth.token, user);
    //     router.push("/");
    //   })
    //   .catch((e) => {
    //     const err: Error = e.response?._data;
    //     if (err?.type === "server_error") setError(err.payload);
    //   });

    var otpRequest = new OtpRequestBody(code);
    console.log("Sending OTP: ",code)
    const response = await pbManager.verifyOtp(otpRequest);
    console.log("Otp response: ",response)

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
    toast({
      title: "Code [Development]",
      description: `Code is: ${code}`,
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  };
  const backToRegistration = setEmail.bind(null, undefined);

  return (
    <MainLayout>
      <Head>
        <title>Greatape | Register</title>
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
