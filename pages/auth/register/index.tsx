import { Container } from "components/Container";
import Link from "next/link";
import { FC, FormEvent } from "react";
import { Input } from "components/Input";
import { Button } from "components/Button";
import { Logo } from "components/Logo";
import { useForm } from "hooks/useForm";
import { z } from "zod";
import { API_SIGN_UP } from "constants/API";
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
  username: z.string().min(1),
  email: z.string().email().min(1),
  password: z.string().min(1),
});

const Register: FC = () => {
  const router = useRouter();
  const { register, errors, post, loading } = useForm<{
    auth: Auth;
    user: User;
  }>(API_SIGN_UP, { email: "", password: "", username: "" }, schema);

  const setAuth = useAuthStore((state) => state.setAuth);
  const signUp = (e: FormEvent<HTMLFormElement>) => {
    post(e).then(({ user, auth }) => {
      setAuth(auth.token, user);
      router.push("/");
    });
  };

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
        <Form
          onSubmit={signUp}
          mt="8"
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
          <Box>
            <Button primary w="full" type="submit" mt={3} isLoading={loading}>
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
      </Box>
    </MainLayout>
  );
};

export default Register;

export const getServerSideProps = withAuth((ctx) => {
  return {
    props: {
      ...authProps(ctx),
    },
  };
});
