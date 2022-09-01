import { Box, BoxProps } from "@chakra-ui/react";
import { FC } from "react";

export const Container: FC<BoxProps> = (props) => {
  return <Box maxW="6xl" w="full" mx="auto" p={2} px={4} {...props} />;
};
