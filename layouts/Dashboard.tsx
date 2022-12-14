import { Box, BoxProps } from "@chakra-ui/react";
import { Container } from "components/Container";
import { Footer } from "components/Footer";
import { Navbar } from "components/Navbar";
import { FC } from "react";

type DashboardProps = {
  footer?: boolean;
} & BoxProps;

export const DashboardLayout: FC<DashboardProps> = ({
  footer = true,
  ...props
}) => {
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
      {footer && (
        <Container>
          <Footer />
        </Container>
      )}
    </Box>
  );
};
