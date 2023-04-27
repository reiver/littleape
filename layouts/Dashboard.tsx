import { Box, BoxProps } from "@chakra-ui/react";
import { Footer } from "components/Footer";
import { Navbar } from "components/Navbar";
import { FC } from "react";
import Feeds from '../pages/feeds';

type DashboardProps = {
  footer?: boolean;
} & BoxProps;

export const DashboardLayout: FC<DashboardProps> = ({
  footer = true,
  ...props
}) => {
  return (
    <Feeds />
    // <Box
    //   bg="light.100"
    //   _dark={{ bg: "dark.900" }}
    //   display="flex"
    //   flexDirection="column"
    //   minH="100vh"
    //   width="max-content"
    // >
    //   <Navbar />
    //   <Feeds />
    //   {/* <Container flexGrow={1} {...props} /> */}
    //   {footer && (
    //     <Box
    //       position="sticky"
    //       bottom="0"
    //       backgroundColor="white"
    //     >
    //       {/* <Footer /> */}
    //     </Box>
    //   )}
    //   {/* <Footer /> */}

    // </Box>
  );
};
