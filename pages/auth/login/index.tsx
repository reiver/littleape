import { AlertIcon, Box, Heading } from "@chakra-ui/react";
import { Alert } from "components/Alert";
import { Button } from "components/Button";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { Logo } from "components/Logo";
import { useForm } from "hooks/useForm";
import { MainLayout } from "layouts/Main";
import { PocketBaseManager, SignInData } from "lib/pocketBaseManager";
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

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
});

const Login: FC = () => {
  const router = useRouter();
  const [error, setError] = useState(null);
  const { register, errors, loading, getValues } = useForm<{
    auth: Auth;
    user: User;
  }>(null, { email: "", password: "" }, schema);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLoginViaPocketBase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    const { email, password } = getValues();

    const signInData = new SignInData(String(email), String(password));

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
      router.push("/");
    } catch (error) {
      console.error("Sign in error:", error);
      const err: Error = error.response?._data;
      if (err?.type === "server_error") setError(err.payload);
    }
  };

  return (
    <MainLayout>
      <Head>
        <title>Greatape | Login</title>
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
        <Form
          onSubmit={handleLoginViaPocketBase}
          mt="8"
          display="flex"
          flexDirection="column"
          experimental_spaceY={4}
        >
          <Input autoFocus {...register("email")} error={errors.email} />
          <Input type="password" {...register("password")} error={errors.password} />
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
          <Link href="/auth/register">
            <Button className="block w-full">Register now</Button>
          </Link>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default Login;

export const getServerSideProps = withAuth("notAuthorized", (ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
