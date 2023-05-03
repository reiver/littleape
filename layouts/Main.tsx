import { Box, BoxProps } from "@chakra-ui/react";
import { Container } from "components/Container";
import { Footer } from "components/Footer";
import { FC, PropsWithChildren } from "react";

export const MainLayout: FC<PropsWithChildren<BoxProps>> = (props) => {
  const { children, ...rest } = props;
  return (
    <Box
      {...rest}
      p={0}
      bg="white"
      textColor="gray.900"
      _dark={{
        bg: "dark.700",
        textColor: "gray.50",
      }}
    >
      <Container
        minH="100vh"
        mx="auto"
        h="full"
        display="flex"
        justifyContent="space-between"
        flexDirection="column"
        p={0}
        paddingInlineEnd="0"
        paddingInlineStart="0"
      >
        <Box
          display="flex"
          padding="10px"
          margin="auto 0"
          // h="full"
          height="88vh"
        >{children}</Box>
        {/* <Footer /> */}
      </Container>
    </Box>
  );
};
