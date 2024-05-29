import {
  Box,
  BoxProps,
  Button,
  chakra,
  HStack,
  IconButton,
  IconButtonProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { BellIcon, EnvelopeIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { Container } from "components/Container";
import { Logo } from "components/Logo";
import { SearchInput } from "components/SearchInput";
import { UserAvatar } from "components/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import { FETCH_USER_INBOX } from "services/api";
import { useAuthStore } from "store";
import useSWR from "swr";
import { OrderedCollection } from "types/ActivityPub";

const VideoIcon = chakra(VideoCameraIcon, { baseStyle: { w: "4" } });
const NotificationIcon = chakra(BellIcon, { baseStyle: { w: "4" } });
const MessagesIcon = chakra(EnvelopeIcon, { baseStyle: { w: "4" } });

const ActionIconButton: FC<Omit<IconButtonProps, "aria-label">> = (props) => {
  return (
    <IconButton
      rounded="full"
      aria-label={"video meeting"}
      minW={8}
      h={8}
      p={0}
      _dark={{
        bg: "dark.600",
        color: "gray.300",
        _hover: {
          bg: "dark.400",
          color: "gray.100",
        },
      }}
      {...props}
    />
  );
};

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
        <Link href="/" passHref>
          <Box
            as="a"
            display="flex"
            alignItems="center"
            experimental_spaceX="2"
            fontWeight="semibold"
            fontSize="lg"
            color="primary.600"
          >
            <Logo w="5" strokeWidth="2" />
            <Text display={{ base: "none", md: "block" }}>Greatape</Text>
          </Box>
        </Link>
        <SearchInput />
        <Box display="flex" experimental_spaceX={3}>
          {user && (
            <>
              <MessagesPopup />
              <ActionIconButton>
                <VideoIcon />
              </ActionIconButton>
            </>
          )}
          {!user && (
            <Link href="/auth/login" passHref>
              <Button size="sm" colorScheme="primary" as="a">
                Login
              </Button>
            </Link>
          )}
          {user && (
            <Menu placement="bottom-end" flip direction="rtl">
              <MenuButton>
                <UserAvatar
                  w={7}
                  h={7}
                  size="sm"
                  link={false}
                  name={user.display_name}
                  src={user.avatar}
                  username={user.username}
                />
              </MenuButton>
              <MenuList
                fontSize="sm"
                minW="100px"
                _dark={{
                  bg: "dark.700",
                }}
              >
                <Link href={`/u/${user.username}`} passHref>
                  <MenuItem as="a">Profile</MenuItem>
                </Link>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          )}
        </Box>
      </Container>
    </Box>
  );
};

const MessagesPopup: FC = () => {
  const user = useAuthStore((state) => state.user);
  console.log("User in messaagesPOp:", user);
  const { data: inbox } = useSWR<OrderedCollection>(FETCH_USER_INBOX(user.username));

  return (
    <Menu placement="bottom-end">
      <MenuButton>
        <ActionIconButton as="span">
          <MessagesIcon />
        </ActionIconButton>
      </MenuButton>
      <MenuList
        maxW="350px"
        w="100vw"
        _dark={{
          bg: "dark.700",
        }}
      >
        {inbox &&
          inbox.orderedItems.map((item, i) => {
            const actorUsername =
              item.object.attributedTo.split("/")[item.object.attributedTo.split("/").length - 1];
            return (
              <div key={item.id}>
                <MenuItem>
                  <HStack experimental_spaceX={3} alignItems="flex-start">
                    <UserAvatar
                      size="sm"
                      src={user.avatar}
                      name={actorUsername}
                      username={user.username}
                    />
                    <VStack
                      alignItems="flex-start"
                      justifyItems="flex-start"
                      experimental_spaceY={1}
                    >
                      <Text fontSize="sm">{item.object.attributedTo}</Text>
                      <Text
                        mt={0}
                        fontSize="sm"
                        _dark={{ color: "gray.500" }}
                        maxW="150px"
                        noOfLines={1}
                        dangerouslySetInnerHTML={{
                          __html: item.object.content,
                        }}
                      />
                    </VStack>
                  </HStack>
                </MenuItem>
                {i !== inbox.orderedItems.length - 1 && <MenuDivider />}
              </div>
            );
          })}
      </MenuList>
    </Menu>
  );
};
