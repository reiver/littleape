import { Box, BoxProps, Image, Text } from "@chakra-ui/react";
import { FC } from "react";

type FooterProps = {
  compact?: boolean;
} & BoxProps;

export const Footer: FC<FooterProps> = (props) => {
  const { compact, ...rest } = props;
  return (
    <Box
      w="full"
      display="flex"
      justifyContent="space-between"
      color="gray.600"
      fontSize="sm"
      py={1}
      px={1}
      bg="light.50"
      borderTop="1px solid #d5d4d4"
      borderBottomColor="gray.200"
      textColor="gray.900"
      _dark={{
        bg: "dark.700",
        textColor: "gray.50",
        borderBottomColor: "dark.600",
      }}
      {...props}
      // _dark={{
      //   color: "gray.400",
      // }}
      // {...rest}
    >
      <Box display="flex" alignItems="center" width="50%" flexDirection="column">
        {/* <Logo w={3.5} strokeWidth={1.8} />
        <Text ml={2}>© 2022 Grateape.</Text> */}
        <Image 
          src="/home.svg"
          width="auto"
          height="30px"
          margin="2px auto"
        />
        <Text display={{ base: "none", sm: "block"}} fontWeight="bold">Home</Text>
      </Box>
      <Box display="flex" alignItems="center" width="50%" flexDirection="column">
        {/* <ThemeSwitcher button={compact} /> */}
        <Image 
          src="/search.svg"
          width="auto"
          height="30px"
          margin="2px auto"
        />
        <Text display={{ base: "none", sm: "block" }} fontWeight="bold">Discover</Text>
      </Box>
    </Box>
  );
};
