import { Box, BoxProps } from "@chakra-ui/react";
import { Container } from "components/Container";
import { Footer } from "components/Footer";
import { Navbar } from "components/Navbar";
import { FC } from "react";

export const DashboardLayout: FC<BoxProps> = (props) => {
  return (
    <Box
      bg="light.100"
      _dark={{ bg: "dark.900" }}
      display="flex"
      flexDirection="column"
      minH="100vh"
    >
      <Navbar />
      <Container flexGrow={1} {...props} />
      <Container>
        <Footer />
      </Container>
    </Box>
  );
};
