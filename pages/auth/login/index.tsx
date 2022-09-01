import { Container } from "components/Container";
import Link from "next/link";
import { FC, FormEvent } from "react";
import { Input } from "components/Input";
import { Button } from "components/Button";
import { Logo } from "components/Logo";
import { z } from "zod";
import { useForm } from "hooks/useForm";
import { API_LOGIN } from "constants/API";
import { Box, Heading } from "@chakra-ui/react";
import { Form } from "components/Form";
import Head from "next/head";
import { Auth } from "types/Auth";
import { User } from "types/User";
import { useAuthStore } from "store";
import { authProps, withAuth } from "lib/withAuth";
import { useRouter } from "next/router";
import { MainLayout } from "layouts/Main";

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
});

const Login: FC = () => {
  const router = useRouter();
  const { register, errors, post, loading } = useForm<{
    auth: Auth;
    user: User;
  }>(API_LOGIN, { email: "", password: "" }, schema);

  const setAuth = useAuthStore((state) => state.setAuth);
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    post(e).then(({ auth, user }) => {
      setAuth(auth.token, user);
      router.push("/");
    });
  };
  return (
    <MainLayout>
      <Head>
        <title>Greateape | Login</title>
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
            Login
          </Heading>
        </Box>
        <Form
          onSubmit={handleLogin}
          mt="8"
          display="flex"
          flexDirection="column"
          experimental_spaceY={4}
        >
          <Input autoFocus {...register("email")} error={errors.email} />
          <Input
            type="password"
            {...register("password")}
            error={errors.password}
          />
          <Box>
            <Button primary w="full" type="submit" mt={3} isLoading={loading}>
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

export const getServerSideProps = withAuth((ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
