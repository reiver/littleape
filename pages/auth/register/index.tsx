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

const registrationSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().min(1),
  password: z.string().min(1),
});

const verifySchema = z.object({
  code: z.string().min(6),
});

const RegistrationForm: FC<{ onRegister: (code: string) => void }> = ({
  onRegister,
}) => {
  const [error, setError] = useState(null);
  const { register, errors, post, loading } = useForm<{
    code: string;
  }>(
    API_SIGN_UP,
    { email: "", password: "", username: "" },
    registrationSchema
  );
  const signUp = (e: FormEvent<HTMLFormElement>) => {
    post(e)
      .then(({ code }) => {
        onRegister(code);
      })
      .catch((e) => {
        const err: Error = e.response?._data;
        if (err?.type === "server_error") setError(err.payload);
      });
  };
  return (
    <>
      <Form
        onSubmit={signUp}
        display="flex"
        flexDirection="column"
        experimental_spaceY={4}
      >
        <Input
          autoFocus
          {...register("username")}
          error={errors.username}
          label="Username"
        />
        <Input {...register("email")} error={errors.email} />
        <Input
          type="password"
          {...register("password")}
          error={errors.password}
        />
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Box>
          <Button
            primary
            w="full"
            type="submit"
            isLoading={loading}
            mt={error ? 0 : 3}
          >
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

const VerifyRegistration: FC<{
  backToRegistration: () => void;
}> = ({ backToRegistration }) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState(null);
  const { setValue, errors, getValues, post, loading } = useForm<{
    auth: Auth;
    user: User;
  }>(API_VERIFY_SIGN_UP, { code: "" }, verifySchema);
  const verify = (e) => {
    post(e)
      .then(({ auth, user }) => {
        setAuth(auth.token, user);
        router.push("/");
      })
      .catch((e) => {
        const err: Error = e.response?._data;
        if (err?.type === "server_error") setError(err.payload);
      });
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
              <PinInput
                autoFocus
                onChange={(code) => setValue("code", code)}
                otp
                size="lg"
              >
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
              {!!errors.code && (
                <FormErrorMessage>{errors.code.message}</FormErrorMessage>
              )}
            </Box>
          </FormControl>
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Button
            isLoading={loading}
            primary
            w="full"
            type="submit"
            mt={error ? 0 : 3}
          >
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
  const [code, setCode] = useState<string | undefined>(undefined);
  const toast = useToast();
  const onRegister = (code) => {
    setCode(code);
    toast({
      title: "Code [Development]",
      description: `Code is: ${code}`,
      status: "success",
      duration: 9000,
    });
  };
  const backToRegistration = setCode.bind(null, undefined);

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
          <Heading
            as="h1"
            display="block"
            textAlign="center"
            fontSize="3xl"
            fontWeight="semibold"
          >
            Register
          </Heading>
        </Box>
        <Box mt="8">
          {!code ? (
            <RegistrationForm onRegister={onRegister} />
          ) : (
            <VerifyRegistration backToRegistration={backToRegistration} />
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
