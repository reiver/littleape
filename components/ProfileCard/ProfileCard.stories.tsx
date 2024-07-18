import { Box } from "@chakra-ui/react";
import { fetcher } from "services/http";
import { useAuthStore } from "store";
import { SWRConfig } from "swr";
import { ProfileCard } from ".";

export default {
  component: ProfileCard,
  title: "UI/ProfileCard",
  decorators: [
    (Story) => {
      return (
        <SWRConfig value={{ fetcher }}>
          <Box maxW="230px">
            <Story />
          </Box>
        </SWRConfig>
      );
    },
  ],
};

useAuthStore.setState({
  user: {
    username: "john",
    banner: "https://bit.ly/3DEvsyb",
    bio: "This is just a placeholder to fill the blank space.",
    name: "John Doe",
  },
});

export const Default = () => <ProfileCard />;
