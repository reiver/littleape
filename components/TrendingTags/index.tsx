import { Box, BoxProps, Text } from "@chakra-ui/react";
import { Card } from "components/Card/Index";
import Link from "next/link";
import { FC } from "react";

const tags = [
  {
    name: "appleevent",
    people: "59",
  },
  {
    name: "TikTok",
    people: "32",
  },
  {
    name: "Zoom",
    people: "21",
  },
];
export const TrendingTags: FC<BoxProps> = (props) => {
  return (
    <Card {...props} p={2}>
      <Text fontSize="" fontWeight="bold" pt={1} pl={1}>
        Trendding Topics
      </Text>

      <Box display="flex" flexDirection="column" experimental_spaceY={2} mt={3}>
        {tags.map((user) => {
          return (
            <Link key={user.name} href={`/topic/${user.name}`} passHref>
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
                <Box maxW="calc(100% - 50px)">
                  <Text fontSize="14" fontWeight="bold" noOfLines={1}>
                    #{user.name}
                  </Text>
                  <Text
                    fontSize="xs"
                    noOfLines={1}
                    _dark={{ color: "gray.500" }}
                  >
                    {user.people} people talking
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
