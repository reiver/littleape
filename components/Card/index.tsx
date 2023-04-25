import { Box, BoxProps } from "@chakra-ui/react";
import { FC } from "react";

export const Card: FC<BoxProps> = (props) => {
  return <Box rounded="lg" bg="light.50" _dark={{ bg: "dark.700" }} p={4} {...props} />;
};
