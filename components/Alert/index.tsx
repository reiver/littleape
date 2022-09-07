import { Alert as ChakraAlert, chakra } from "@chakra-ui/react";

export const Alert = chakra(ChakraAlert, {
  baseStyle: {
    rounded: "md",

    _dark: {
      color: "red.200",
    },
  },
});
