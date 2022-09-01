import { Box, BoxProps, Text } from "@chakra-ui/react";
import { Logo } from "components/Logo";
import { FC } from "react";
import { ThemeSwitcher } from "../ThemeSwitcher";

export const Footer: FC<BoxProps> = (props) => {
  return (
    <Box
      w="full"
      display="flex"
      justifyContent="space-between"
      color="gray.600"
      fontSize="sm"
      _dark={{
        color: "gray.400",
      }}
      {...props}
    >
      <Box display="flex">
        <Logo w={3.5} strokeWidth={1.8} />
        <Text ml={2}>© 2022 Grateape.</Text>
      </Box>
      <Box display="flex" experimental_spaceX={2}>
        <Text>Theme</Text>
        <ThemeSwitcher />
      </Box>
    </Box>
  );
};
