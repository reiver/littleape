import { Box, BoxProps, Link, Text } from "@chakra-ui/react";
import { Logo } from "components/Logo";
import { FC } from "react";
import { ThemeSwitcher } from "../ThemeSwitcher";

type FooterProps = {
  compact?: boolean;
} & BoxProps;

export const Footer: FC<FooterProps> = (props) => {
  const { compact, ...rest } = props;
  return (
    <Box
      w="full"
      display="flex"
      justifyContent="center"
      color="gray.600"
      fontSize="sm"
      _dark={{
        color: "gray.400",
      }}
      {...rest}
    >
      <Box display="flex" alignItems="center">
        <Text ml={2}>
          Powered by{" "}
          <Link href={`https://greata.pe`} isExternal color="black" fontWeight="bold">
            GreatApe
          </Link>
        </Text>
      </Box>
    </Box>
  );
};
