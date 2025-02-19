import { Box } from "@chakra-ui/react";
import { MightLikeCard } from ".";

export default {
  component: MightLikeCard,
  title: "UI/MightLikeCard",
  decorators: [
    (Story) => (
      <Box maxW="250px">
        <Story />
      </Box>
    ),
  ],
};

export const MightLike = () => <MightLikeCard />;
