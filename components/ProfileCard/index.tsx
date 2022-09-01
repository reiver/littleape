import {
  AspectRatio,
  Box,
  BoxProps,
  Button,
  chakra,
  Text,
} from "@chakra-ui/react";
import { UserAvatar } from "components/UserAvatar";
import { FC } from "react";
import { useAuthStore } from "store";

const Img = chakra("img");

export const ProfileCard: FC<BoxProps> = (props) => {
  const user = useAuthStore((state) => state.user);
  return (
    <Box rounded="lg" bg="light.50" _dark={{ bg: "dark.700" }} p={1} {...props}>
      <AspectRatio ratio={16 / 6}>
        <Img src="https://bit.ly/3wGNvPU" objectFit="cover" rounded="lg" />
      </AspectRatio>
      <Box display="flex" justifyContent="center" mt={-3}>
        <UserAvatar
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
          <Text fontWeight="semibold">1234</Text>
          <Text color="gray.500" fontSize="xs">
            Following
          </Text>
        </Box>
        <Box>
          <Text fontWeight="semibold">1234</Text>
          <Text color="gray.500" fontSize="xs">
            Followers
          </Text>
        </Box>
      </Box>
      <Box textAlign="center" fontSize="sm" mt={4}>
        <Text fontWeight="semibold">{user.display_name || "John Doe"}</Text>
        <Text fontSize="xs" mt={1}>
          @{user.username}
        </Text>
      </Box>
      <Box p={2}>
        <Button
          w="full"
          size="sm"
          fontSize="sm"
          fontWeight="sm"
          mt={4}
          _dark={{
            bg: "dark.500",
            _active: {
              bg: "dark.600",
            },
          }}
        >
          My Profile
        </Button>
      </Box>
    </Box>
  );
};
