import { Avatar, Box, BoxProps, Text } from "@chakra-ui/react";
import { Card } from "components/Card/Index";
import Link from "next/link";
import { FC } from "react";

const users = [
  {
    name: "Rebeca",
    username: "@reb@" + process.env.NEXT_PUBLIC_HANDLE,
    avatar: "https://bit.ly/3D5g2D3",
  },
  {
    name: "James",
    username: "@james@" + process.env.NEXT_PUBLIC_HANDLE,
    avatar: "https://bit.ly/3eDmeYQ",
  },
  {
    name: "Bananna",
    username: "@bananna@c.im",
    avatar: "https://bit.ly/3BqgMS3",
  },
];

export const MightLikeCard: FC<BoxProps> = (props) => {
  return (
    <Card {...props} p={2}>
      <Text fontSize="" fontWeight="bold" pt={1} pl={1}>
        You might like
      </Text>

      <Box display="flex" flexDirection="column" experimental_spaceY={2} mt={3}>
        {users.map((user) => {
          return (
            <Link key={user.username} href={`/u/${user.username}`} passHref>
              <Box
                as="a"
                display="flex"
                experimental_spaceX={2}
                maxW="100%"
                overflow="hidden"
                rounded="md"
                p="2"
                transition="all 200ms ease-out"
                _dark={{
                  _hover: {
                    bg: "dark.600",
                  },
                }}
                _hover={{
                  bg: "light.200",
                }}
              >
                <Avatar
                  w="10"
                  h="10"
                  size="md"
                  name={user.name}
                  src={user.avatar}
                />
                <Box maxW="calc(100% - 50px)">
                  <Text fontSize="14" noOfLines={1}>
                    {user.name}
                  </Text>
                  <Text
                    fontSize="xs"
                    noOfLines={1}
                    _dark={{ color: "gray.500" }}
                  >
                    {user.username}
                  </Text>
                </Box>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Card>
  );
};
