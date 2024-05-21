import { Box } from "@chakra-ui/react";
import { TrendingTags } from ".";

export default {
  component: TrendingTags,
  title: "UI/TrendingTags",
  decorators: [
    (Story) => (
      <Box maxW="250px">
        <Story />
      </Box>
    ),
  ],
};

export const TrendingTopics = () => <TrendingTags />;
