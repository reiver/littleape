import { Box, BoxProps, Button, Spinner, Text } from "@chakra-ui/react";
import { UserAvatar } from "components/UserAvatar";
import { UserCover } from "components/UserCover";
import Link from "next/link";
import { FC } from "react";
import { FETCH_USER_FOLLOWERS, FETCH_USER_FOLLOWING } from "services/api";
import { useAuthStore } from "store";
import useSWR from "swr";
import { OrderedCollection } from "types/ActivityPub";

export const ProfileCard: FC<BoxProps> = (props) => {
  const user = useAuthStore((state) => state.user);
  const { data: followers } = useSWR<OrderedCollection>(null);//FETCH_USER_FOLLOWERS(user)
  const { data: following } = useSWR<OrderedCollection>(null);//FETCH_USER_FOLLOWING(user)
  return (
    <Box rounded="lg" bg="light.50" _dark={{ bg: "dark.700" }} p={1} {...props}>
      <UserCover ratio={16 / 6} src={user?.banner || ''} />
      <Box display="flex" justifyContent="center" mt={-3}>
        <UserAvatar
          src={user?.avatar || ''}
          username={user?.username || ''}
          name={user?.display_name || ''}
          borderStyle="solid"
          borderWidth="3px"
          borderColor="light.50"
          _dark={{ borderColor: "dark.700" }}
          w="14"
          h="14"
        />
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        px={4}
        fontSize="sm"
        textAlign="center"
        mt={-9}
      >
        <Box>
          {!following ? (
            <Spinner size="xs" />
          ) : (
            <Text fontWeight="semibold">{following.totalItems}</Text>
          )}
          <Text color="gray.500" fontSize="xs">
            Following
          </Text>
        </Box>
        <Box>
          {!followers ? (
            <Spinner size="xs" />
          ) : (
            <Text fontWeight="semibold">{followers.totalItems}</Text>
          )}
          <Text color="gray.500" fontSize="xs">
            Followers
          </Text>
        </Box>
      </Box>
      <Box textAlign="center" fontSize="sm" mt={4} px={1}>
        <Text fontWeight="semibold">{user?.display_name || ''}</Text>
        <Text fontSize="xs">@{user?.username || ''}</Text>
        <Text
          fontSize="xs"
          _dark={{
            color: "gray.400",
          }}
          mt={2}
        >
          {user?.bio || ''}
        </Text>
      </Box>
      <Box p={2}>
        <Link href={`/u/${user?.username || ''}`} passHref>
          <Button
            as="a"
            w="full"
            size="sm"
            fontSize="sm"
            fontWeight="sm"
            mt={2}
            _dark={{
              bg: "dark.500",
              _active: {
                bg: "dark.600",
              },
            }}
          >
            My Profile
          </Button>
        </Link>
      </Box>
    </Box>
  );
};
