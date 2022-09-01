import {
  Avatar,
  Box,
  BoxProps,
  Button,
  chakra,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import { Container } from "components/Container";
import { Logo } from "components/Logo";
import { SearchInput } from "components/SearchInput";
import { useRouter } from "next/router";
import { FC } from "react";
import { useAuthStore } from "store";

const VideoCamera = chakra(VideoCameraIcon);

export const Navbar: FC<BoxProps> = (props) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      py={1}
      bg="light.50"
      borderBottom="1px solid"
      borderBottomColor="gray.200"
      textColor="gray.900"
      _dark={{
        bg: "dark.700",
        textColor: "gray.50",
        borderBottomColor: "dark.600",
      }}
      {...props}
    >
      <Container
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        experimental_spaceX={4}
      >
        <Box
          display="flex"
          alignItems="center"
          experimental_spaceX="2"
          fontWeight="semibold"
          fontSize="lg"
          color="primary.600"
        >
          <Logo w="5" strokeWidth="2" />
          <Text>Greatape</Text>
        </Box>
        <SearchInput />
        <Box display="flex" experimental_spaceX={3}>
          <IconButton
            rounded="full"
            aria-label={"video meeting"}
            minW={8}
            h={8}
            p={0}
            _dark={{
              color: "gray.300",
              _hover: {
                color: "gray.100",
              },
            }}
          >
            <VideoCamera w={4} />
          </IconButton>
          <Menu placement="bottom-end" flip direction="rtl">
            <MenuButton>
              <Avatar w={7} h={7} name={user.display_name} src={user.avatar} />
            </MenuButton>
            <MenuList
              fontSize="sm"
              minW="100px"
              _dark={{
                bg: "dark.700",
              }}
            >
              <MenuItem>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Container>
    </Box>
  );
};
