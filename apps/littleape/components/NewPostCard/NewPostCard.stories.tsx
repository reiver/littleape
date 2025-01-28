import { Box } from "@chakra-ui/react";
import { useAuthStore } from "store";
import { NewPostCard } from ".";

export default {
  component: NewPostCard,
  title: "UI/Feed/NewPost",
  decorators: [
    (Story) => (
      <Box maxW="xl">
        <Story />
      </Box>
    ),
  ],
};

useAuthStore.setState({
  user: {
    username: "narixius",
  },
});

export const NewPost = () => <NewPostCard />;
